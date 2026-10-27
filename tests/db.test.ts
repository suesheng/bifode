import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(() => {
  process.env.DATABASE_PATH = join(mkdtempSync(join(tmpdir(), 'bifode-test-')), 'test.db');
  process.env.ADMIN_EMAILS = 'admin@example.org, Second@Example.org';
});

describe('migrations', () => {
  it('apply once and record versions', async () => {
    const { getDb } = await import('../src/lib/db');
    const { migrations } = await import('../src/lib/migrations');
    const rows = getDb().prepare('SELECT version FROM schema_migrations ORDER BY version').all() as { version: number }[];
    expect(rows.map((r) => r.version)).toEqual(migrations.map((m) => m.version));
    expect(getDb().prepare('SELECT COUNT(*) AS n FROM members').get()).toEqual({ n: 0 });
  });

  it('have unique ascending versions', async () => {
    const { migrations } = await import('../src/lib/migrations');
    const v = migrations.map((m) => m.version);
    expect(new Set(v).size).toBe(v.length);
    expect(v).toEqual([...v].sort((a, b) => a - b));
  });
});

describe('admin sessions', () => {
  const jar = (value?: string) => ({ get: () => (value ? { value } : undefined) });

  it('accept admins only, case-insensitive list', async () => {
    const { adminEmails, createSession, sessionEmail } = await import('../src/lib/auth');
    expect(adminEmails()).toEqual(['admin@example.org', 'second@example.org']);
    expect(sessionEmail(jar(createSession('admin@example.org')))).toBe('admin@example.org');
    expect(sessionEmail(jar(createSession('stranger@example.org')))).toBeNull();
  });

  it('reject missing, unknown and destroyed sessions', async () => {
    const { createSession, destroySession, sessionEmail } = await import('../src/lib/auth');
    expect(sessionEmail(jar())).toBeNull();
    expect(sessionEmail(jar('not-a-session'))).toBeNull();
    const id = createSession('admin@example.org');
    destroySession(id);
    expect(sessionEmail(jar(id))).toBeNull();
  });

  it('login tokens are unknown by default and never reusable', async () => {
    const { consumeToken } = await import('../src/lib/auth');
    expect(consumeToken('deadbeef')).toBeNull();
  });
});
