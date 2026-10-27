import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

let db: DatabaseSync | undefined;

export function getDb(): DatabaseSync {
  if (db) return db;
  const file = process.env.DATABASE_PATH || join(homedir(), 'bifode-data', 'bifode.db');
  mkdirSync(dirname(file), { recursive: true });
  db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT NOT NULL DEFAULT 'pending',
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      street TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      city TEXT NOT NULL,
      newsletter INTEGER NOT NULL DEFAULT 0,
      locale TEXT NOT NULL DEFAULT 'de',
      note TEXT,
      created_at TEXT NOT NULL,
      decided_at TEXT
    );
    CREATE TABLE IF NOT EXISTS login_tokens (
      token_hash TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id_hash TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);
  return db;
}
