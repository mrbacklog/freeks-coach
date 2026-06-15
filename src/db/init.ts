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
  }
  return db;
}
