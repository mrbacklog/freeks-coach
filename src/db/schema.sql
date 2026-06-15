-- Freek's Coach - SQLite Schema
-- All tables use CREATE TABLE IF NOT EXISTS for idempotency

CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  korfball_days TEXT NOT NULL DEFAULT '[]',
  korfball_time TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_check_in (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  sleep_score INTEGER NOT NULL CHECK(sleep_score BETWEEN 1 AND 5),
  fatigue_score INTEGER NOT NULL CHECK(fatigue_score BETWEEN 1 AND 5),
  pain_level INTEGER NOT NULL CHECK(pain_level BETWEEN 0 AND 5),
  pain_location TEXT,
  pain_affects_movement INTEGER NOT NULL DEFAULT 0 CHECK(pain_affects_movement IN (0, 1)),
  motivation_score INTEGER NOT NULL CHECK(motivation_score BETWEEN 1 AND 5),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS weekly_check_in (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL UNIQUE,
  body_energy INTEGER NOT NULL CHECK(body_energy BETWEEN 1 AND 5),
  muscle_soreness INTEGER NOT NULL CHECK(muscle_soreness BETWEEN 1 AND 5),
  sleep_quality INTEGER NOT NULL CHECK(sleep_quality BETWEEN 1 AND 5),
  notes TEXT,
  confirmed_at TEXT
);

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  weekly_check_in_id INTEGER NOT NULL REFERENCES weekly_check_in(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
  type TEXT NOT NULL,
  rpe INTEGER CHECK(rpe BETWEEN 1 AND 10),
  duration_minutes INTEGER,
  tournament_matches INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS training_plan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL UNIQUE,
  generated_at TEXT NOT NULL DEFAULT (datetime('now')),
  raw_json TEXT NOT NULL DEFAULT '{}',
  personalization_messages TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS session (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL REFERENCES training_plan(id) ON DELETE CASCADE,
  scheduled_date TEXT NOT NULL,
  completed_at TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS exercise (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK(category IN ('beensterkte', 'bovenlichaam', 'kern', 'plyometrie', 'herstel')),
  description TEXT NOT NULL,
  safety_cue TEXT NOT NULL,
  korfbal_context TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_bilateral INTEGER NOT NULL DEFAULT 1 CHECK(is_bilateral IN (0, 1)),
  phv_safety TEXT NOT NULL CHECK(phv_safety IN ('allowed', 'caution', 'restricted')),
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '10',
  rest_seconds INTEGER NOT NULL DEFAULT 60
);

CREATE TABLE IF NOT EXISTS session_exercise (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES session(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercise(id) ON DELETE RESTRICT,
  sets_completed INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS measurement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  measured_at TEXT NOT NULL DEFAULT (datetime('now')),
  height_cm REAL,
  weight_kg REAL,
  sitting_height_cm REAL,
  vertical_jump_cm REAL,
  jump_left_cm REAL,
  jump_right_cm REAL,
  balance_left REAL,
  balance_right REAL,
  medball_left REAL,
  medball_right REAL,
  sprint_10m_sec REAL
);

CREATE TABLE IF NOT EXISTS goal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  metric TEXT,
  target_value REAL,
  target_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  achieved_at TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS safety_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  active INTEGER NOT NULL DEFAULT 0 CHECK(active IN (0, 1)),
  reason TEXT,
  blocked_since TEXT,
  cleared_at TEXT,
  physio_confirmed INTEGER NOT NULL DEFAULT 0 CHECK(physio_confirmed IN (0, 1))
);
