import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

import { migrations } from './migrations';

let db: DatabaseSync | undefined;

function migrate(conn: DatabaseSync) {
  conn.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)');
  const applied = new Set(
    (conn.prepare('SELECT version FROM schema_migrations').all() as { version: number }[]).map((r) => r.version)
  );
  for (const m of [...migrations].sort((a, b) => a.version - b.version)) {
    if (applied.has(m.version)) continue;
    conn.exec('BEGIN');
    try {
      conn.exec(m.sql);
      conn.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(m.version, m.name, new Date().toISOString());
      conn.exec('COMMIT');
    } catch (error) {
      conn.exec('ROLLBACK');
      throw error;
    }
  }
}


export function getDb(): DatabaseSync {
  if (db) return db;
  const file = process.env.DATABASE_PATH || join(homedir(), 'bifode-data', 'bifode.db');
  mkdirSync(dirname(file), { recursive: true });
  db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL');
  migrate(db);
  return db;
}
