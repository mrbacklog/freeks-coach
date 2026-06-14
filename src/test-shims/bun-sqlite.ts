// Shim: maps bun:sqlite API to better-sqlite3 for vitest compatibility
import BetterSQLite from "better-sqlite3";

export class Database {
  private db: BetterSQLite.Database;

  constructor(path: string, options?: { readonly?: boolean; create?: boolean }) {
    const opts: BetterSQLite.Options = {};
    if (options?.readonly === true) opts.readonly = true;
    this.db = new BetterSQLite(path, opts);
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  prepare(sql: string) {
    return this.db.prepare(sql);
  }

  query(sql: string) {
    const stmt = this.db.prepare(sql);
    return {
      all: (...args: unknown[]) => stmt.all(...args),
      // bun:sqlite returns null for missing rows; better-sqlite3 returns undefined
      get: (...args: unknown[]) => stmt.get(...args) ?? null,
      run: (...args: unknown[]) => stmt.run(...args),
    };
  }

  run(sql: string, ...params: unknown[]): void {
    this.db.prepare(sql).run(...params);
  }

  close(): void {
    this.db.close();
  }

  get(sql: string, ...params: unknown[]): unknown {
    return this.db.prepare(sql).get(...params);
  }

  all(sql: string, ...params: unknown[]): unknown[] {
    return this.db.prepare(sql).all(...params);
  }
}

export default { Database };
