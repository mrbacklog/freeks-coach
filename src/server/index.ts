import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { getDb } from "../db/init";
import { seedExercises } from "../db/seed";
import { getRandomMessage } from "./content/completionMessages";
import { authMiddleware, clearSessionCookie, setSessionCookie } from "./middleware/auth";
import { generatePlan } from "./services/planningEngine";
import { calculateAsymmetry, calculatePhv } from "./utils/phv";

const app = new Hono();

// CORS for all API routes (credentials: true requires exact origin)
const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:3000";
app.use("/api/*", cors({ origin: allowedOrigin, credentials: true }));

// Health check (public)
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Login route (public)
app.post("/api/login", async (c) => {
  const body = await c.req.json();
  const password = process.env.AUTH_PASSWORD;
  if (!password) {
    return c.json({ error: "AUTH_PASSWORD niet geconfigureerd." }, 500);
  }
  if (body.password === password) {
    setSessionCookie(c);
    return c.json({ success: true });
  }
  return c.json({ error: "Onjuist wachtwoord — probeer opnieuw." }, 401);
});

// Logout route (public)
app.post("/api/logout", (c) => {
  clearSessionCookie(c);
  return c.json({ success: true });
});

// Auth status (protected) — used by AuthGuard
app.get("/api/auth/status", authMiddleware, (c) => c.json({ authenticated: true }));

// User profile (protected)
app.get("/api/user/profile", authMiddleware, (c) => {
  const db = getDb();
  const user =
    (db.query("SELECT * FROM user LIMIT 1").get() as Record<string, unknown> | null) || null;
  return c.json({ user });
});

// Onboarding (protected)
app.post("/api/user/onboarding", authMiddleware, async (c) => {
  const body = (await c.req.json()) as {
    name: string;
    birthDate: string;
    korfballDays: string[];
    korfballTime?: string;
    heightCm?: number;
    weightKg?: number;
    sittingHeightCm?: number;
    goal?: { title: string; type?: string };
  };
  const db = getDb();

  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO user (id, name, birth_date, korfball_days, korfball_time, updated_at)
    VALUES (1, ?, ?, ?, ?, datetime('now'))
  `);
  insertUser.run(
    body.name,
    body.birthDate,
    JSON.stringify(body.korfballDays),
    body.korfballTime || "",
  );

  if (body.heightCm && body.weightKg) {
    const insertMeasurement = db.prepare(`
      INSERT INTO measurement (measured_at, height_cm, weight_kg, sitting_height_cm)
      VALUES (datetime('now'), ?, ?, ?)
    `);
    insertMeasurement.run(body.heightCm, body.weightKg, body.sittingHeightCm ?? null);
  }

  if (body.goal?.title) {
    const insertGoal = db.prepare(`
      INSERT INTO goal (title, type, created_at)
      VALUES (?, ?, datetime('now'))
    `);
    insertGoal.run(body.goal.title, body.goal.type || "algemeen");
  }

  const weekStart = getMonday(new Date()).toISOString().split("T")[0];
  const planJson = JSON.stringify({
    sessions: [],
    coachExplanation: "Week 1 — jouw eerste trainingsweek. Laten we rustig beginnen.",
    personalizationMessages: ["Welkom bij je gepersonaliseerd trainingsplan."],
  });
  const insertPlan = db.prepare(`
    INSERT OR IGNORE INTO training_plan (week_start, generated_at, raw_json, personalization_messages)
    VALUES (?, datetime('now'), ?, ?)
  `);
  insertPlan.run(weekStart, planJson, "Welkom bij je eerste week!");

  return c.json({ success: true });
});

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Generate plan
app.post("/api/plan/generate", authMiddleware, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { weekStart?: string };
  const weekStart = body.weekStart || getMonday(new Date()).toISOString().split("T")[0];

  const db = getDb();
  const plan = generatePlan(db, weekStart);

  if (!plan.blocked) {
    // Save to database
    const insertPlan = db.prepare(`
      INSERT OR REPLACE INTO training_plan (week_start, generated_at, raw_json, personalization_messages)
      VALUES (?, datetime('now'), ?, ?)
    `);
    insertPlan.run(weekStart, JSON.stringify(plan), plan.personalizationMessages.join("\n"));

    // Create session records
    for (const session of plan.sessions) {
      const insertSession = db.prepare(`
        INSERT OR IGNORE INTO session (plan_id, scheduled_date, notes)
        SELECT id, ?, ? FROM training_plan WHERE week_start = ? ORDER BY generated_at DESC LIMIT 1
      `);
      insertSession.run(session.scheduledDate, session.name, weekStart);
    }
  }

  return c.json(plan);
});

// Get plan for specific week (or current week)
app.get("/api/plan/:weekStart", authMiddleware, (c) => {
  const db = getDb();
  const weekStart = c.req.param("weekStart");
  const plan = db
    .query("SELECT * FROM training_plan WHERE week_start = ? ORDER BY generated_at DESC LIMIT 1")
    .get(weekStart) as { raw_json: string } | null;
  if (!plan) return c.json({ plan: null });
  return c.json({ plan: JSON.parse(plan.raw_json) });
});

// Get sessions for a week
app.get("/api/sessions/:weekStart", authMiddleware, (c) => {
  const db = getDb();
  const weekStart = c.req.param("weekStart");

  const sessions = db
    .query(`
    SELECT s.*, tp.week_start
    FROM session s
    JOIN training_plan tp ON s.plan_id = tp.id
    WHERE tp.week_start = ?
    ORDER BY s.scheduled_date
  `)
    .all(weekStart) as Array<{
    id: number;
    scheduled_date: string;
    notes: string;
    completed_at: string | null;
  }>;

  return c.json({ sessions });
});

// Get home state
app.get("/api/home/state", authMiddleware, (c) => {
  const db = getDb();

  // Check user profile
  const user = db.query("SELECT * FROM user LIMIT 1").get() as {
    name: string;
    birth_date: string;
  } | null;
  if (!user) return c.json({ state: "D" });

  // Check safety block
  const safety = db.query("SELECT active FROM safety_status WHERE active = 1 LIMIT 1").get() as {
    active: number;
  } | null;
  if (safety?.active)
    return c.json({ state: "E", user: { name: user.name, birth_date: user.birth_date } });

  // Check today's check-in
  const today = new Date().toISOString().split("T")[0];
  const todayCheckIn = db.query("SELECT id FROM daily_check_in WHERE date = ?").get(today);

  // Check weekly check-in
  const weekStart = getMonday(new Date()).toISOString().split("T")[0];
  const weeklyCheckIn = db
    .query("SELECT id FROM weekly_check_in WHERE week_start = ?")
    .get(weekStart);

  // Check current plan
  const planRow = db
    .query("SELECT * FROM training_plan WHERE week_start = ? ORDER BY generated_at DESC LIMIT 1")
    .get(weekStart) as { id: number; raw_json: string; personalization_messages: string } | null;

  const dayOfWeek = new Date().getDay(); // 0=Sunday, 1=Monday, ...
  const isWeeklyCheckInDue = (dayOfWeek === 0 || dayOfWeek === 1) && !weeklyCheckIn;

  // Get last daily check-in for quick stats
  const lastCheckIn = db
    .query("SELECT fatigue_score, sleep_score FROM daily_check_in ORDER BY date DESC LIMIT 1")
    .get() as { fatigue_score: number; sleep_score: number } | null;

  const userPayload = { name: user.name, birth_date: user.birth_date };

  if (!todayCheckIn) return c.json({ state: "A", user: userPayload });
  if (isWeeklyCheckInDue) return c.json({ state: "B", user: userPayload });

  if (planRow) {
    // Build plan payload
    const rawPlan = JSON.parse(planRow.raw_json) as {
      sessions?: Array<{ scheduledDate: string; name: string; exercises?: unknown[] }>;
      personalizationMessages?: string[];
    };

    // Get sessions from session table for this plan
    const sessions = db
      .query(`
        SELECT s.id, s.notes, s.completed_at,
               CAST(strftime('%w', s.scheduled_date) AS INTEGER) as day_of_week_int
        FROM session s
        WHERE s.plan_id = ?
        ORDER BY s.scheduled_date
      `)
      .all(planRow.id) as Array<{
      id: number;
      notes: string;
      completed_at: string | null;
      day_of_week_int: number;
    }>;

    const completed = sessions.filter((s) => s.completed_at).length;
    const total = sessions.length;
    const adherencePercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Map day_of_week_int to abbreviated string for display
    const dayNames = ["zo", "ma", "di", "wo", "do", "vr", "za"];
    const sessionsMapped = sessions.map((s) => ({
      id: s.id,
      day_of_week: dayNames[s.day_of_week_int] ?? "?",
      notes: s.notes,
      completed_at: s.completed_at,
    }));

    // Find today's session
    const todaySession = sessions.find((s) => s.day_of_week_int === dayOfWeek) ?? null;
    const todaySessionPayload = todaySession
      ? {
          id: todaySession.id,
          notes: todaySession.notes,
          day_of_week: dayNames[todaySession.day_of_week_int] ?? "?",
        }
      : undefined;

    // Build personalization messages array
    const personalizationMessages: string[] = Array.isArray(rawPlan.personalizationMessages)
      ? rawPlan.personalizationMessages
      : planRow.personalization_messages
        ? planRow.personalization_messages.split("\n").filter(Boolean)
        : [];

    const plan = {
      weekStart,
      sessions: sessionsMapped,
      personalizationMessages,
      adherencePercent,
    };

    return c.json({
      state: "C",
      user: userPayload,
      plan,
      todaySession: todaySessionPayload,
      lastCheckIn: lastCheckIn ?? undefined,
    });
  }

  return c.json({ state: "A", user: userPayload });
});

// Get plan adherence for a week
app.get("/api/plan/adherence/:weekStart", authMiddleware, (c) => {
  const db = getDb();
  const weekStart = c.req.param("weekStart");

  const total =
    (
      db
        .query(`
    SELECT COUNT(*) as cnt FROM session s
    JOIN training_plan tp ON s.plan_id = tp.id
    WHERE tp.week_start = ?
  `)
        .get(weekStart) as { cnt: number }
    )?.cnt || 0;

  const completed =
    (
      db
        .query(`
    SELECT COUNT(*) as cnt FROM session s
    JOIN training_plan tp ON s.plan_id = tp.id
    WHERE tp.week_start = ? AND s.completed_at IS NOT NULL
  `)
        .get(weekStart) as { cnt: number }
    )?.cnt || 0;

  const adherence = total > 0 ? Math.round((completed / total) * 100) : 0;
  return c.json({ total, completed, adherence, weekStart });
});

// Get all goals
app.get("/api/goals", authMiddleware, (c) => {
  const db = getDb();
  const goals = db
    .query("SELECT * FROM goal WHERE achieved_at IS NULL ORDER BY created_at DESC")
    .all() as Array<{
    id: number;
    title: string;
    type: string;
    metric: string | null;
    target_value: string | null;
    target_date: string | null;
    notes: string | null;
    created_at: string;
  }>;
  const achieved = db
    .query("SELECT * FROM goal WHERE achieved_at IS NOT NULL ORDER BY achieved_at DESC")
    .all();
  return c.json({ goals, achieved });
});

// Get current plan
app.get("/api/plan/current", authMiddleware, (c) => {
  const db = getDb();
  const weekStart = getMonday(new Date()).toISOString().split("T")[0];

  const plan = db
    .query(`
    SELECT * FROM training_plan WHERE week_start = ? ORDER BY generated_at DESC LIMIT 1
  `)
    .get(weekStart) as { raw_json: string } | null;

  if (!plan) return c.json({ plan: null });

  return c.json({ plan: JSON.parse(plan.raw_json) });
});

// Daily check-in
app.post("/api/check-in/daily", authMiddleware, async (c) => {
  const body = (await c.req.json()) as {
    sleepScore: number;
    fatigueScore: number;
    painLevel: number;
    painLocation?: string;
    painAffectsMovement?: boolean;
    motivationScore: number;
  };
  const db = getDb();

  const today = new Date().toISOString().split("T")[0];

  // Insert check-in
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO daily_check_in
    (date, sleep_score, fatigue_score, pain_level, pain_location, pain_affects_movement, motivation_score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  stmt.run(
    today,
    body.sleepScore,
    body.fatigueScore,
    body.painLevel,
    body.painLocation || null,
    body.painAffectsMovement ? 1 : 0,
    body.motivationScore,
  );

  // Safety protocol: severe pain + movement affected → activate safety block
  if (body.painLevel >= 3 && body.painAffectsMovement) {
    const safetyStmt = db.prepare(`
      INSERT INTO safety_status (active, reason, blocked_since, physio_confirmed)
      VALUES (1, 'Ernstige pijn die beweging beïnvloedt', datetime('now'), 0)
    `);
    safetyStmt.run();

    return c.json({
      saved: true,
      safetyBlock: true,
      message:
        "Je meldt pijn die je beweging beïnvloedt. Alle spring- en krachtoefeningen zijn gepauzeerd.",
    });
  }

  return c.json({
    saved: true,
    safetyBlock: false,
    summary: {
      fatigue: body.fatigueScore,
      sleep: body.sleepScore,
      motivation: body.motivationScore,
    },
  });
});

// Get today's check-in status
app.get("/api/check-in/daily/today", authMiddleware, (c) => {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];
  const checkIn = db.query("SELECT * FROM daily_check_in WHERE date = ?").get(today) as Record<
    string,
    unknown
  > | null;
  return c.json({ checkIn });
});

// Map text day names to integers for schema compatibility
const dayNameToInt: Record<string, number> = { ma: 1, di: 2, wo: 3, do: 4, vr: 5, za: 6, zo: 0 };
// Map muscle soreness text to integer (1-10 scale)
const muscleSorenessToInt: Record<string, number> = { geen: 1, licht: 3, behoorlijk: 6, erg: 9 };

// Weekly check-in submit
app.post("/api/check-in/weekly", authMiddleware, async (c) => {
  const body = (await c.req.json()) as {
    weekStart: string;
    activities: Array<{
      dayOfWeek: string;
      type: string;
      rpe: number;
      durationMinutes: number;
    }>;
    bodyEnergy: number;
    muscleSoreness: string;
    sleepQuality: number;
    notes?: string;
    korfbalPosition?: string;
    korfbalExplosiveness?: number;
    korfbalNotes?: string;
  };

  const db = getDb();

  const muscleSorenessInt = muscleSorenessToInt[body.muscleSoreness] ?? 1;

  // Insert weekly check-in
  const checkInStmt = db.prepare(`
    INSERT OR REPLACE INTO weekly_check_in (week_start, body_energy, muscle_soreness, sleep_quality, notes, confirmed_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);
  const result = checkInStmt.run(
    body.weekStart,
    body.bodyEnergy,
    muscleSorenessInt,
    body.sleepQuality,
    body.notes || null,
  );

  const weeklyCheckInId = result.lastInsertRowid;

  // Insert activity logs
  for (const activity of body.activities) {
    const dayInt = dayNameToInt[activity.dayOfWeek] ?? 0;
    const actStmt = db.prepare(`
      INSERT INTO activity_log (weekly_check_in_id, day_of_week, type, rpe, duration_minutes)
      VALUES (?, ?, ?, ?, ?)
    `);
    actStmt.run(weeklyCheckInId, dayInt, activity.type, activity.rpe, activity.durationMinutes);
  }

  return c.json({ saved: true, weeklyCheckInId });
});

// Get weekly check-in status
app.get("/api/check-in/weekly/current", authMiddleware, (c) => {
  const db = getDb();
  const weekStart = getMonday(new Date()).toISOString().split("T")[0];
  const checkIn = db
    .query("SELECT * FROM weekly_check_in WHERE week_start = ?")
    .get(weekStart) as Record<string, unknown> | null;
  return c.json({ checkIn, weekStart });
});

// Get session details (exercises etc.)
app.get("/api/session/:id", authMiddleware, (c) => {
  const sessionId = c.req.param("id");
  const db = getDb();

  const session = db
    .query(`
    SELECT s.*, tp.raw_json as plan_json
    FROM session s
    LEFT JOIN training_plan tp ON s.plan_id = tp.id
    WHERE s.id = ?
  `)
    .get(sessionId) as {
    id: number;
    plan_id: number;
    scheduled_date: string;
    completed_at: string | null;
    notes: string;
    plan_json: string;
  } | null;

  if (!session) return c.json({ error: "Session not found" }, 404);

  // Parse exercises from plan
  let exercises: Array<{
    exerciseId: number;
    name: string;
    sets: number;
    reps: string;
    restSeconds: number;
    category: string;
  }> = [];
  if (session.plan_json) {
    const plan = JSON.parse(session.plan_json);
    const daySession = plan.sessions?.find(
      (s: { name: string; exercises: unknown[] }) => s.name === session.notes,
    );
    if (daySession?.exercises) {
      exercises = daySession.exercises;
    }
  }

  // Fetch full exercise details
  const exerciseDetails = exercises
    .map((ex) => {
      const detail = db.query("SELECT * FROM exercise WHERE id = ?").get(ex.exerciseId) as {
        id: number;
        name: string;
        description: string;
        safety_cue: string;
        korfbal_context: string;
        sets: number;
        reps: string;
        rest_seconds: number;
      } | null;
      return detail ? { ...detail, plannedSets: ex.sets, plannedReps: ex.reps } : null;
    })
    .filter(Boolean);

  return c.json({ session, exercises: exerciseDetails });
});

// Complete a session
app.patch("/api/session/:id/complete", authMiddleware, async (c) => {
  const sessionId = c.req.param("id");
  const db = getDb();

  // Mark session as completed
  const stmt = db.prepare(`
    UPDATE session SET completed_at = datetime('now') WHERE id = ?
  `);
  stmt.run(sessionId);

  // Get the session info for completion message
  const session = db.query("SELECT * FROM session WHERE id = ?").get(sessionId) as {
    notes: string;
  } | null;

  const message = getRandomMessage();

  return c.json({ completed: true, message, sessionName: session?.notes || "Training" });
});

// Get all measurements
app.get("/api/measurements", authMiddleware, (c) => {
  const db = getDb();
  const measurements = db
    .query("SELECT * FROM measurement ORDER BY measured_at ASC")
    .all() as Array<{
    id: number;
    measured_at: string;
    height_cm: number | null;
    weight_kg: number | null;
    sitting_height_cm: number | null;
    vertical_jump_cm: number | null;
    jump_left_cm: number | null;
    jump_right_cm: number | null;
    balance_left: number | null;
    balance_right: number | null;
    medball_left: number | null;
    medball_right: number | null;
    sprint_10m_sec: number | null;
  }>;
  return c.json({ measurements });
});

// Add a new measurement
app.post("/api/measurements", authMiddleware, async (c) => {
  const body = (await c.req.json()) as {
    heightCm?: number;
    weightKg?: number;
    sittingHeightCm?: number;
    verticalJumpCm?: number;
    jumpLeftCm?: number;
    jumpRightCm?: number;
    balanceLeft?: number;
    balanceRight?: number;
    medballLeft?: number;
    medballRight?: number;
    sprint10mSec?: number;
  };

  const db = getDb();

  // Get previous measurements for PR check
  const previousMeasurements = db
    .query("SELECT * FROM measurement ORDER BY measured_at DESC LIMIT 1")
    .get() as {
    sprint_10m_sec: number | null;
    vertical_jump_cm: number | null;
    jump_left_cm: number | null;
    jump_right_cm: number | null;
  } | null;

  const stmt = db.prepare(`
    INSERT INTO measurement (
      measured_at, height_cm, weight_kg, sitting_height_cm,
      vertical_jump_cm, jump_left_cm, jump_right_cm,
      balance_left, balance_right, medball_left, medball_right, sprint_10m_sec
    ) VALUES (datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    body.heightCm || null,
    body.weightKg || null,
    body.sittingHeightCm || null,
    body.verticalJumpCm || null,
    body.jumpLeftCm || null,
    body.jumpRightCm || null,
    body.balanceLeft || null,
    body.balanceRight || null,
    body.medballLeft || null,
    body.medballRight || null,
    body.sprint10mSec || null,
  );

  // Check for PRs
  const prs: Array<{ metric: string; value: number; previous: number; improvement: string }> = [];

  if (body.sprint10mSec && previousMeasurements?.sprint_10m_sec) {
    if (body.sprint10mSec < previousMeasurements.sprint_10m_sec) {
      const improvement = (previousMeasurements.sprint_10m_sec - body.sprint10mSec).toFixed(2);
      prs.push({
        metric: "10m sprint",
        value: body.sprint10mSec,
        previous: previousMeasurements.sprint_10m_sec,
        improvement: `${improvement}s`,
      });
    }
  }
  if (body.verticalJumpCm && previousMeasurements?.vertical_jump_cm) {
    if (body.verticalJumpCm > previousMeasurements.vertical_jump_cm) {
      const improvement = (body.verticalJumpCm - previousMeasurements.vertical_jump_cm).toFixed(0);
      prs.push({
        metric: "verticale sprong",
        value: body.verticalJumpCm,
        previous: previousMeasurements.vertical_jump_cm,
        improvement: `${improvement}cm`,
      });
    }
  }

  return c.json({ saved: true, prs });
});

// PHV calculation endpoint
app.get("/api/measurements/phv", authMiddleware, (c) => {
  const db = getDb();

  // Get user for age calculation
  const user = db.query("SELECT birth_date FROM user LIMIT 1").get() as {
    birth_date: string;
  } | null;
  if (!user) return c.json({ phv: null });

  // Get most recent measurements with height data
  const measurement = db
    .query(`
    SELECT height_cm, weight_kg, sitting_height_cm,
           jump_left_cm, jump_right_cm,
           balance_left, balance_right,
           medball_left, medball_right
    FROM measurement
    WHERE height_cm IS NOT NULL AND sitting_height_cm IS NOT NULL AND weight_kg IS NOT NULL
    ORDER BY measured_at DESC LIMIT 1
  `)
    .get() as {
    height_cm: number;
    weight_kg: number;
    sitting_height_cm: number;
    jump_left_cm: number | null;
    jump_right_cm: number | null;
    balance_left: number | null;
    balance_right: number | null;
    medball_left: number | null;
    medball_right: number | null;
  } | null;

  if (!measurement) return c.json({ phv: null });

  // Calculate age in days
  const birthDate = new Date(user.birth_date);
  const today = new Date();
  const ageDays = (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24);

  const phv = calculatePhv(
    measurement.height_cm,
    measurement.weight_kg,
    measurement.sitting_height_cm,
    ageDays,
  );

  // Calculate asymmetries
  const asymmetries: Array<{ metric: string; left: number; right: number; ratio: number }> = [];

  if (measurement.jump_left_cm !== null && measurement.jump_right_cm !== null) {
    const ratio = calculateAsymmetry(measurement.jump_left_cm, measurement.jump_right_cm);
    if (ratio > 0.15) {
      asymmetries.push({
        metric: "Sprong",
        left: measurement.jump_left_cm,
        right: measurement.jump_right_cm,
        ratio,
      });
    }
  }
  if (measurement.balance_left !== null && measurement.balance_right !== null) {
    const ratio = calculateAsymmetry(measurement.balance_left, measurement.balance_right);
    if (ratio > 0.15) {
      asymmetries.push({
        metric: "Balance",
        left: measurement.balance_left,
        right: measurement.balance_right,
        ratio,
      });
    }
  }
  if (measurement.medball_left !== null && measurement.medball_right !== null) {
    const ratio = calculateAsymmetry(measurement.medball_left, measurement.medball_right);
    if (ratio > 0.15) {
      asymmetries.push({
        metric: "Medicijnbal",
        left: measurement.medball_left,
        right: measurement.medball_right,
        ratio,
      });
    }
  }

  return c.json({ phv, asymmetries, latestMeasurement: measurement });
});

// Create a new goal
app.post("/api/goals", authMiddleware, async (c) => {
  const body = (await c.req.json()) as {
    title: string;
    type: string;
    metric?: string | null;
    targetValue?: string;
    targetDate?: string;
    notes?: string;
  };
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO goal (title, type, metric, target_value, target_date, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  const result = stmt.run(
    body.title,
    body.type,
    body.metric ?? null,
    body.targetValue || null,
    body.targetDate || null,
    body.notes || null,
  );
  return c.json({ id: result.lastInsertRowid, saved: true });
});

// Update a goal
app.patch("/api/goals/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = (await c.req.json()) as {
    title?: string;
    type?: string;
    metric?: string | null;
    targetValue?: string;
    targetDate?: string;
    notes?: string;
  };
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE goal SET title = COALESCE(?, title), type = COALESCE(?, type),
    metric = COALESCE(?, metric),
    target_value = COALESCE(?, target_value), target_date = COALESCE(?, target_date),
    notes = COALESCE(?, notes)
    WHERE id = ?
  `);
  stmt.run(
    body.title || null,
    body.type || null,
    body.metric ?? null,
    body.targetValue || null,
    body.targetDate || null,
    body.notes || null,
    id,
  );
  return c.json({ saved: true });
});

// Delete a goal
app.delete("/api/goals/:id", authMiddleware, (c) => {
  const id = c.req.param("id");
  const db = getDb();
  db.prepare("DELETE FROM goal WHERE id = ?").run(id);
  return c.json({ deleted: true });
});

// Mark goal as achieved
app.patch("/api/goals/:id/achieve", authMiddleware, (c) => {
  const id = c.req.param("id");
  const db = getDb();
  db.prepare("UPDATE goal SET achieved_at = datetime('now') WHERE id = ?").run(id);
  return c.json({ achieved: true });
});

// Get single goal
app.get("/api/goals/:id", authMiddleware, (c) => {
  const id = c.req.param("id");
  const db = getDb();
  const goal = db.query("SELECT * FROM goal WHERE id = ?").get(id);
  if (!goal) return c.json({ error: "Not found" }, 404);
  return c.json({ goal });
});

// Exercise library
app.get("/api/exercises", authMiddleware, (c) => {
  const db = getDb();
  const category = c.req.query("category");
  const search = c.req.query("search");

  let query = "SELECT * FROM exercise WHERE 1=1";
  const params: string[] = [];

  if (category && category !== "alle") {
    query += " AND category = ?";
    params.push(category);
  }

  if (search) {
    query += " AND name LIKE ?";
    params.push(`%${search}%`);
  }

  query += " ORDER BY name";
  const exercises = db.query(query).all(...params) as Array<{
    id: number;
    name: string;
    category: string;
    description: string;
    safety_cue: string;
    korfbal_context: string;
    difficulty: string;
    phv_safety: string;
    sets: number;
    reps: string;
    rest_seconds: number;
  }>;
  return c.json({ exercises });
});

app.get("/api/exercises/:id", authMiddleware, (c) => {
  const db = getDb();
  const exercise = db.query("SELECT * FROM exercise WHERE id = ?").get(c.req.param("id"));
  if (!exercise) return c.json({ error: "Not found" }, 404);
  return c.json({ exercise });
});

// History
app.get("/api/history", authMiddleware, (c) => {
  const db = getDb();
  const week = c.req.query("week") || getMonday(new Date()).toISOString().split("T")[0];

  // Get daily check-ins for the week
  const weekEnd = new Date(week);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  const checkIns = db
    .query("SELECT * FROM daily_check_in WHERE date >= ? AND date <= ? ORDER BY date")
    .all(week, weekEndStr);

  // Get completed sessions
  const sessions = db
    .query(`
    SELECT s.*, tp.week_start FROM session s
    JOIN training_plan tp ON s.plan_id = tp.id
    WHERE tp.week_start = ? AND s.completed_at IS NOT NULL
  `)
    .all(week);

  // Get activity log for this week's weekly check-in
  const weeklyCheckIn = db
    .query("SELECT * FROM weekly_check_in WHERE week_start = ?")
    .get(week) as { id: number } | null;
  const activities = weeklyCheckIn
    ? db
        .query("SELECT * FROM activity_log WHERE weekly_check_in_id = ? ORDER BY day_of_week")
        .all(weeklyCheckIn.id)
    : [];

  return c.json({ week, checkIns, sessions, activities, weeklyCheckIn });
});

// User profile update
app.patch("/api/user/profile", authMiddleware, async (c) => {
  const body = (await c.req.json()) as {
    name?: string;
    birthDate?: string;
    korfballDays?: string[];
    korfballTime?: string;
  };
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE user SET name = COALESCE(?, name), birth_date = COALESCE(?, birth_date),
    korfball_days = COALESCE(?, korfball_days), korfball_time = COALESCE(?, korfball_time),
    updated_at = datetime('now') WHERE id = 1
  `);
  stmt.run(
    body.name || null,
    body.birthDate || null,
    body.korfballDays ? JSON.stringify(body.korfballDays) : null,
    body.korfballTime || null,
  );
  return c.json({ saved: true });
});

// Data export
app.get("/api/user/export", authMiddleware, (c) => {
  const db = getDb();
  const user = db.query("SELECT * FROM user LIMIT 1").get();
  const measurements = db.query("SELECT * FROM measurement ORDER BY measured_at").all();
  const goals = db.query("SELECT * FROM goal ORDER BY created_at").all();
  const checkIns = db.query("SELECT * FROM daily_check_in ORDER BY date").all();
  const plans = db
    .query(
      "SELECT week_start, generated_at, personalization_messages FROM training_plan ORDER BY week_start",
    )
    .all();

  const exportData = {
    user,
    measurements,
    goals,
    checkIns,
    plans,
    exportedAt: new Date().toISOString(),
  };

  c.header("Content-Type", "application/json");
  c.header("Content-Disposition", 'attachment; filename="freeks-coach-export.json"');
  return c.body(JSON.stringify(exportData, null, 2));
});

// Weekly training volume for progress screen
app.get("/api/progress/weekly-volume", authMiddleware, (c) => {
  const db = getDb();
  const rows = db
    .query(`
      SELECT
        tp.week_start,
        COALESCE(SUM(se.sets_completed), 0) as total_sets,
        COUNT(DISTINCT CASE WHEN s.completed_at IS NOT NULL THEN s.id END) as sessions_completed
      FROM training_plan tp
      LEFT JOIN session s ON s.plan_id = tp.id
      LEFT JOIN session_exercise se ON se.session_id = s.id AND s.completed_at IS NOT NULL
      GROUP BY tp.week_start
      ORDER BY tp.week_start ASC
      LIMIT 12
    `)
    .all();
  return c.json(rows);
});

// Protect all other /api/* routes
app.use("/api/*", authMiddleware);

// Serve React SPA static files in production (relative to CWD = /app in Docker)
app.use("/*", serveStatic({ root: "./dist" }));
// SPA fallback: serve index.html for unmatched routes (client-side routing)
app.get("/*", async (c) => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const html = readFileSync(join(__dirname, "../../dist/index.html"), "utf-8");
  return c.html(html);
});

// Initialize DB on startup
const db = getDb();
seedExercises(db);

export default {
  port: Number(process.env.PORT ?? 3001),
  fetch: app.fetch,
};
