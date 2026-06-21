import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let db: Database | null = null;

export function getDb(): Database {
  if (!db) {
    const dbPath = process.env.DB_PATH ?? join(__dirname, "../../data/freeks-coach.db");
    db = new Database(dbPath, { create: true });
    db.exec("PRAGMA journal_mode=WAL");
    db.exec("PRAGMA foreign_keys=ON");
    const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
    db.exec(schema);
    // Migratie: voeg metric kolom toe aan goal als die nog niet bestaat
    const goalCols = db.query("PRAGMA table_info(goal)").all() as { name: string }[];
    if (!goalCols.some((c) => c.name === "metric")) {
      db.exec("ALTER TABLE goal ADD COLUMN metric TEXT;");
    }
    // Seed Freek Laban als er nog geen gebruiker is
    const existingUser = db.query("SELECT id FROM user LIMIT 1").get();
    if (!existingUser) {
      db.exec(`
        INSERT INTO user (id, name, birth_date, korfball_days, korfball_time, updated_at)
        VALUES (1, 'Freek Laban', '2012-05-15', '[]', '', datetime('now'))
      `);
    }
    // Migratie: vergroot exercise.category CHECK-constraint voor coordinatie en snelheid
    const exerciseSql = db
      .query("SELECT sql FROM sqlite_master WHERE type='table' AND name='exercise'")
      .get() as { sql: string } | null;
    if (exerciseSql?.sql && !exerciseSql.sql.includes("coordinatie")) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS exercise_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          category TEXT NOT NULL CHECK(category IN ('beensterkte', 'bovenlichaam', 'kern', 'plyometrie', 'herstel', 'coordinatie', 'snelheid')),
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
        INSERT OR IGNORE INTO exercise_new SELECT * FROM exercise;
        DROP TABLE exercise;
        ALTER TABLE exercise_new RENAME TO exercise;
      `);
    }
  }
  return db;
}
