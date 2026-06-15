import type { Database } from "bun:sqlite";
import { assertPhvCap } from "./assert-schedule";
import { isInPhvVenster, mirwaldOffset } from "../utils/mirwald";
import { analyseerTrend } from "./trend-detection";

export interface PlanResult {
  blocked: boolean;
  reason?: string;
  weekStart: string;
  sessions: PlannedSession[];
  coachExplanation: string;
  personalizationMessages: string[];
  volumeModifier: number;
  plyoVolumeModifier: number;
}

export interface PlannedSession {
  dayOfWeek: number; // 1=Monday, 7=Sunday
  scheduledDate: string;
  name: string;
  durationMinutes: number;
  intensityLabel: string;
  exercises: PlannedExercise[];
}

export interface PlannedExercise {
  exerciseId: number;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  category: string;
}

interface SafetyStatus {
  active: number;
  reason: string | null;
}

interface DailyCheckIn {
  date: string;
  fatigue_score: number;
  pain_level: number;
  pain_affects_movement: number;
}

interface Measurement {
  measured_at: string;
  height_cm: number;
  sitting_height_cm: number | null;
  weight_kg: number | null;
}

interface Exercise {
  id: number;
  name: string;
  category: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  phv_safety: string;
  difficulty: string;
}

interface Goal {
  id: number;
  title: string;
  type: string;
  metric: string | null;
}

interface User {
  korfball_days: string;
}

export function generatePlan(db: Database, weekStart: string): PlanResult {
  // Step 1: Safety gate
  const safety = db
    .query("SELECT active, reason FROM safety_status WHERE active = 1 LIMIT 1")
    .get() as SafetyStatus | null;
  if (safety?.active) {
    return {
      blocked: true,
      reason: safety.reason || "Veiligheids-blokkade actief",
      weekStart,
      sessions: [],
      coachExplanation: "Training is gepauzeerd vanwege een veiligheids-blokkade.",
      personalizationMessages: [],
      volumeModifier: 0,
      plyoVolumeModifier: 0,
    };
  }

  // Step 2: Load calculation
  let volumeModifier = 1.0;

  // Get daily check-ins for last 3 weeks
  const threeWeeksAgo = new Date(weekStart);
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
  const checkIns = db
    .query(`
    SELECT date, fatigue_score, pain_level, pain_affects_movement
    FROM daily_check_in
    WHERE date >= ?
    ORDER BY date
  `)
    .all(threeWeeksAgo.toISOString().split("T")[0]) as DailyCheckIn[];

  // Calculate fatigue trend per week
  const weeks = groupByWeek(checkIns);
  const weeklyAvgFatigue = weeks.map((w) =>
    w.length > 0 ? w.reduce((sum, d) => sum + d.fatigue_score, 0) / w.length : 0,
  );

  const highFatigueWeeks = weeklyAvgFatigue.filter((avg) => avg > 3.5).length;
  if (highFatigueWeeks >= 3) {
    volumeModifier -= 0.2;
  }

  // Bereken weekelijkse adherentie (voltooide sessies / geplande sessies)
  const weeklyAdherentie: number[] = weeks.map((_, weekIdx) => {
    const weekOffset = (2 - weekIdx) * 7;
    const ws = new Date(weekStart);
    ws.setDate(ws.getDate() - weekOffset);
    const wsStr = ws.toISOString().split("T")[0];
    const row = db
      .query(`
        SELECT
          COUNT(CASE WHEN s.completed_at IS NOT NULL THEN 1 END) as completed,
          COUNT(s.id) as total
        FROM training_plan tp
        LEFT JOIN session s ON s.plan_id = tp.id
        WHERE tp.week_start = ?
      `)
      .get(wsStr) as { completed: number; total: number } | null;
    if (!row || row.total === 0) return 0;
    return row.completed / row.total;
  });

  const trendAnalyse = analyseerTrend(weeklyAvgFatigue, weeklyAdherentie);

  // Step 3: PHV adjustment
  let plyoVolumeModifier = 1.0;
  let plyoIntensity = "high";

  const measurements = db
    .query(`
    SELECT measured_at, height_cm, sitting_height_cm, weight_kg
    FROM measurement
    WHERE height_cm IS NOT NULL
    ORDER BY measured_at ASC
  `)
    .all() as Measurement[];

  const growthVelocity = calculateGrowthVelocity(measurements);

  if (growthVelocity > 1.0) {
    plyoVolumeModifier -= 0.3;
    plyoIntensity = "moderate";
  }

  // PHV-venster check via Mirwald (F7)
  const latestWithData = [...measurements]
    .reverse()
    .find((m) => m.sitting_height_cm !== null && m.weight_kg !== null);
  let phvVensterActief = false;
  if (latestWithData?.sitting_height_cm && latestWithData.weight_kg) {
    const userBirth = db
      .query("SELECT birth_date FROM user LIMIT 1")
      .get() as { birth_date: string } | null;
    if (userBirth) {
      const leeftijdDec =
        (new Date(latestWithData.measured_at).getTime() -
          new Date(userBirth.birth_date).getTime()) /
        (365.25 * 24 * 60 * 60 * 1000);
      const offset = mirwaldOffset(
        latestWithData.height_cm,
        latestWithData.sitting_height_cm,
        latestWithData.weight_kg,
        leeftijdDec,
      );
      if (offset !== null && isInPhvVenster(offset)) {
        phvVensterActief = true;
        plyoVolumeModifier = Math.min(plyoVolumeModifier, 0.6);
        plyoIntensity = "low";
      }
    }
  }

  // F7: asserteer PHV-cap (werpt Error als constraint geschonden)
  assertPhvCap(phvVensterActief, plyoVolumeModifier);

  // Trend-gebaseerde aanpassingen
  if (trendAnalyse.overreaching) {
    plyoVolumeModifier *= 0.8;
  }

  // Laad activiteiten voor huidige week
  const huidigWeekCheckin = db
    .query(`SELECT id FROM weekly_check_in WHERE week_start = ? LIMIT 1`)
    .get(weekStart) as { id: number } | null;

  const activiteitenDezeWeek: { day_of_week: number; type: string }[] = huidigWeekCheckin
    ? (db
        .query(`SELECT day_of_week, type FROM activity_log WHERE weekly_check_in_id = ?`)
        .all(huidigWeekCheckin.id) as { day_of_week: number; type: string }[])
    : [];

  const earlyMessages: string[] = [];

  // Toetsweek: 20% volume-reductie
  const toetsDagen = activiteitenDezeWeek.filter((a) => a.type === "toetsweek").length;
  if (toetsDagen >= 3) {
    volumeModifier = Math.min(volumeModifier, 0.8);
    earlyMessages.push("Toetsweek — kort en fris, geen pieken.");
  }

  // Toernooi: dag-voor en dag-na = sprongvrij (herstellDagen bevat 0-indexed dag_of_week waarden)
  const toernooidagen = activiteitenDezeWeek
    .filter((a) => a.type === "toernooi")
    .map((a) => a.day_of_week);
  const herstellDagen = new Set<number>();
  for (const dag of toernooidagen) {
    if (dag > 0) herstellDagen.add(dag - 1);
    herstellDagen.add(dag);
    if (dag < 6) herstellDagen.add(dag + 1);
  }

  // schoolsport / andere_sport: beschouw als extra bezette dagen
  const extraBezetteDagen = activiteitenDezeWeek
    .filter((a) => a.type === "schoolsport" || a.type === "andere_sport")
    .map((a) => a.day_of_week + 1); // activity_log gebruikt 0-6, planningEngine gebruikt 1-7

  // Step 4: Day structure
  const user = db.query("SELECT korfball_days FROM user LIMIT 1").get() as User | null;
  const korfballDays: string[] = user?.korfball_days ? JSON.parse(user.korfball_days) : [];

  const dayMap: Record<string, number> = { ma: 1, di: 2, wo: 3, do: 4, vr: 5, za: 6, zo: 7 };
  const korfballDayNums = korfballDays.map((d) => dayMap[d] || 0).filter((d) => d > 0);

  // Step 5: Exercise selection
  const exercises = db
    .query(`
    SELECT id, name, category, sets, reps, rest_seconds, phv_safety, difficulty
    FROM exercise
    WHERE phv_safety != 'restricted'
    ORDER BY RANDOM()
  `)
    .all() as Exercise[];

  const goals = db
    .query("SELECT id, title, type, metric FROM goal WHERE achieved_at IS NULL")
    .all() as Goal[];

  // Doel-metric koppeling: bepaal voorkeurscategorie op basis van actief doel
  let voorkeursCategorie: string | null = null;
  const actieveDoel = goals[0] ?? null;
  if (actieveDoel?.metric === "sprong" || actieveDoel?.metric === "eenbenige_sprong") {
    voorkeursCategorie = "plyometrie";
  } else if (actieveDoel?.metric === "sprint") {
    voorkeursCategorie = "snelheid";
  }

  const sessions = buildSessions(
    weekStart,
    korfballDayNums,
    exercises,
    volumeModifier,
    plyoVolumeModifier,
    plyoIntensity,
    herstellDagen,
    extraBezetteDagen,
    voorkeursCategorie,
  );

  // Step 6: Personalization messages
  const personalizationMessages = buildPersonalizationMessages(
    db,
    weekStart,
    goals,
    volumeModifier,
    plyoVolumeModifier,
    growthVelocity,
    highFatigueWeeks,
    trendAnalyse.boodschap,
    earlyMessages,
  );

  const coachExplanation = buildCoachExplanation(
    goals,
    volumeModifier,
    plyoVolumeModifier,
    growthVelocity,
    highFatigueWeeks,
    weeklyAvgFatigue,
  );

  return {
    blocked: false,
    weekStart,
    sessions,
    coachExplanation,
    personalizationMessages,
    volumeModifier: Math.round(volumeModifier * 100) / 100,
    plyoVolumeModifier: Math.round(plyoVolumeModifier * 100) / 100,
  };
}

function groupByWeek(checkIns: DailyCheckIn[]): DailyCheckIn[][] {
  const weeks: DailyCheckIn[][] = [[], [], []];
  const now = new Date();

  for (const ci of checkIns) {
    const date = new Date(ci.date);
    const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo < 7) weeks[2].push(ci);
    else if (daysAgo < 14) weeks[1].push(ci);
    else if (daysAgo < 21) weeks[0].push(ci);
  }
  return weeks;
}

function calculateGrowthVelocity(measurements: Measurement[]): number {
  if (measurements.length < 2) return 0;

  const recent = measurements[measurements.length - 1];
  const oldest = measurements[0];

  const heightDiff = recent.height_cm - oldest.height_cm;
  const timeDiff = new Date(recent.measured_at).getTime() - new Date(oldest.measured_at).getTime();
  const monthsDiff = timeDiff / (1000 * 60 * 60 * 24 * 30.44);

  if (monthsDiff < 0.1) return 0;
  return heightDiff / monthsDiff; // cm per month
}

function buildSessions(
  weekStart: string,
  korfballDays: number[],
  exercises: Exercise[],
  volumeModifier: number,
  plyoVolumeModifier: number,
  plyoIntensity: string,
  herstellDagen: Set<number>,
  extraBezetteDagen: number[],
  voorkeursCategorie: string | null,
): PlannedSession[] {
  const sessions: PlannedSession[] = [];

  // Herschik categorieën als er een voorkeur is
  const baseCategories = ["beensterkte", "bovenlichaam", "kern", "plyometrie"];
  if (voorkeursCategorie && baseCategories.includes(voorkeursCategorie)) {
    const idx = baseCategories.indexOf(voorkeursCategorie);
    baseCategories.unshift(...baseCategories.splice(idx, 1));
  }

  // Plan 3 training sessions on non-korfball days
  const bezetteDagen = new Set([...korfballDays, ...extraBezetteDagen]);
  const trainingDays = [1, 2, 3, 4, 5, 6, 7].filter((d) => !bezetteDagen.has(d));
  const selectedDays = trainingDays.slice(0, 3);

  const weekStartDate = new Date(weekStart);

  for (let i = 0; i < selectedDays.length; i++) {
    const dayOfWeek = selectedDays[i];
    const sessionDate = new Date(weekStartDate);
    sessionDate.setDate(weekStartDate.getDate() + dayOfWeek - 1);

    const category = baseCategories[i % baseCategories.length];
    // activity_log day_of_week is 0-6; sessie dayOfWeek is 1-7
    const isDagInHerstelveld = herstellDagen.has(dayOfWeek - 1);
    const effectieveCategorie = isDagInHerstelveld && category === "plyometrie" ? "herstel" : category;
    const isPlyo = effectieveCategorie === "plyometrie";
    const modifier = isPlyo ? plyoVolumeModifier : volumeModifier;

    const categoryExercises = exercises
      .filter((e) => e.category === effectieveCategorie)
      .slice(0, Math.max(2, Math.floor(4 * modifier)));

    const sessionExercises: PlannedExercise[] = categoryExercises.map((e) => ({
      exerciseId: e.id,
      name: e.name,
      sets: Math.max(2, Math.floor(e.sets * modifier)),
      reps: e.reps,
      restSeconds: e.rest_seconds,
      category: e.category,
    }));

    sessions.push({
      dayOfWeek,
      scheduledDate: sessionDate.toISOString().split("T")[0],
      name: capitalizeCategory(effectieveCategorie),
      durationMinutes: isPlyo ? Math.floor(30 * modifier) : Math.floor(45 * modifier),
      intensityLabel: isPlyo ? plyoIntensity : "moderate",
      exercises: sessionExercises,
    });
  }

  return sessions;
}

function capitalizeCategory(cat: string): string {
  const names: Record<string, string> = {
    beensterkte: "Beensterkte",
    bovenlichaam: "Bovenlichaam",
    kern: "Kernkracht",
    plyometrie: "Explosiviteit",
    herstel: "Herstel",
    coordinatie: "Coördinatie",
    snelheid: "Snelheid",
  };
  return names[cat] || cat;
}

function buildCoachExplanation(
  goals: Goal[],
  volumeModifier: number,
  plyoVolumeModifier: number,
  growthVelocity: number,
  highFatigueWeeks: number,
  weeklyAvgFatigue: number[],
): string {
  const parts: string[] = [];

  if (highFatigueWeeks >= 3) {
    const avgFatigue =
      weeklyAvgFatigue.reduce((a, b) => a + b, 0) / Math.max(1, weeklyAvgFatigue.length);
    parts.push(
      `Je vermoeidheid was de afgelopen weken gemiddeld ${avgFatigue.toFixed(1)}/5 — dat is hoog. Ik heb het volume met 20% verlaagd zodat je lichaam kan herstellen.`,
    );
  }

  if (growthVelocity > 1.0) {
    parts.push(
      `Je groeit momenteel snel (${growthVelocity.toFixed(1)} cm/maand). Ik houd springoefeningen conservatiever om je gewrichten te beschermen.`,
    );
  }

  if (goals.length > 0) {
    const goal = goals[0];
    parts.push(`Je werkt naar je doel: "${goal.title}". Dit plan is gericht op dat resultaat.`);
  }

  if (parts.length === 0) {
    parts.push(
      "Dit week gebalanceerde training voor kracht en explosiviteit. Pas goed op je herstel.",
    );
  }

  return parts.join(" ");
}

function buildPersonalizationMessages(
  db: Database,
  weekStart: string,
  goals: Goal[],
  volumeModifier: number,
  plyoVolumeModifier: number,
  growthVelocity: number,
  highFatigueWeeks: number,
  trendBoodschap: string | null,
  earlyMessages: string[],
): string[] {
  const messages = [...earlyMessages];

  // Get week number (approximate)
  const firstPlan = db
    .query("SELECT week_start FROM training_plan ORDER BY generated_at ASC LIMIT 1")
    .get() as { week_start: string } | null;
  let weekNumber = 1;
  if (firstPlan) {
    const firstDate = new Date(firstPlan.week_start);
    const currentDate = new Date(weekStart);
    weekNumber =
      Math.floor((currentDate.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
  }

  if (weekNumber >= 4) {
    // EC-1: From week 4, at least 2 personalization messages with reference to check-in data
    const recentCheckIn = db
      .query(`
      SELECT AVG(fatigue_score) as avg_fatigue, AVG(sleep_score) as avg_sleep
      FROM daily_check_in
      WHERE date >= date(?, '-7 days')
    `)
      .get(weekStart) as { avg_fatigue: number | null; avg_sleep: number | null } | null;

    if (recentCheckIn?.avg_fatigue) {
      messages.push(
        `Vorige week gemiddelde vermoeidheid: ${recentCheckIn.avg_fatigue.toFixed(1)}/5. ${recentCheckIn.avg_fatigue > 3.0 ? "Ik heb het trainingsvolume daarop aangepast." : "Je herstel is goed — we kunnen iets aanpakken."}`,
      );
    }

    if (recentCheckIn?.avg_sleep) {
      messages.push(
        `Slaapscore vorige week: ${recentCheckIn.avg_sleep.toFixed(1)}/5. ${recentCheckIn.avg_sleep < 3 ? "Prioriteit: zorg voor meer nachtrust voor optimaal herstel." : "Goede slaapkwaliteit — je lichaam verwerkt de training goed."}`,
      );
    }
  }

  if (goals.length > 0) {
    messages.push(`Doel in zicht: "${goals[0].title}". Deze week direct op gericht.`);
  }

  if (trendBoodschap) {
    messages.push(trendBoodschap);
  }

  return messages;
}
