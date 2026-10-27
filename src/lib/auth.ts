import { createHash, randomBytes } from 'node:crypto';
import { getDb } from './db';
import { env } from './env';
import { sendMail, mailConfigured } from './mail';

const COOKIE = 'bf_admin';
const TOKEN_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const sha = (v: string) => createHash('sha256').update(v).digest('hex');

export function adminEmails(): string[] {
  return String(env('ADMIN_EMAILS') || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Sends a one-time login link if the address is an admin. Always looks the same to the caller. */
export async function requestLogin(email: string, origin: string): Promise<void> {
  const addr = email.trim().toLowerCase();
  if (!adminEmails().includes(addr) || !mailConfigured()) {
    if (!mailConfigured()) console.error('Admin login requested but SMTP is not configured.');
    return;
  }
  const token = randomBytes(32).toString('hex');
  const db = getDb();
  db.prepare('DELETE FROM login_tokens WHERE expires_at < ?').run(Date.now());
  db.prepare('INSERT INTO login_tokens (token_hash, email, expires_at) VALUES (?, ?, ?)').run(
    sha(token),
    addr,
    Date.now() + TOKEN_TTL_MS
  );
  const link = `${origin}/admin/verify?token=${token}`;
  await sendMail({
    to: addr,
    subject: 'BiFoDe Admin – Anmeldelink',
    text: `Anmeldelink (15 Minuten gültig, einmalig verwendbar):\n${link}\n\nFalls Sie das nicht angefordert haben, ignorieren Sie diese E-Mail.`
  });
}

export function consumeToken(token: string): string | null {
  const db = getDb();
  const row = db
    .prepare('SELECT email, expires_at FROM login_tokens WHERE token_hash = ?')
    .get(sha(token)) as { email: string; expires_at: number } | undefined;
  db.prepare('DELETE FROM login_tokens WHERE token_hash = ?').run(sha(token));
  if (!row || row.expires_at < Date.now() || !adminEmails().includes(row.email)) return null;
  return row.email;
}

export function createSession(email: string): string {
  const id = randomBytes(32).toString('hex');
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  db.prepare('INSERT INTO sessions (id_hash, email, expires_at) VALUES (?, ?, ?)').run(
    sha(id),
    email,
    Date.now() + SESSION_TTL_MS
  );
  return id;
}

export function sessionEmail(cookies: { get(name: string): { value: string } | undefined }): string | null {
  const id = cookies.get(COOKIE)?.value;
  if (!id) return null;
  const row = getDb()
    .prepare('SELECT email, expires_at FROM sessions WHERE id_hash = ?')
    .get(sha(id)) as { email: string; expires_at: number } | undefined;
  if (!row || row.expires_at < Date.now() || !adminEmails().includes(row.email)) return null;
  return row.email;
}

export function destroySession(id: string | undefined) {
  if (id) getDb().prepare('DELETE FROM sessions WHERE id_hash = ?').run(sha(id));
}

export const SESSION_COOKIE = COOKIE;
export const SESSION_MAX_AGE_S = SESSION_TTL_MS / 1000;

export function publicOrigin(request: Request): string {
  const configured = env('SITE_URL');
  if (configured) return String(configured).replace(/\/$/, '');
  const proto = request.headers.get('x-forwarded-proto') || new URL(request.url).protocol.replace(':', '');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || new URL(request.url).host;
  return `${proto}://${host}`;
}

/** Hosts allowed as Origin: the request host, SITE_URL, TRUSTED_HOSTS (comma list) and the public domains. */
function trustedHosts(request: Request): string[] {
  const hosts = ['www.bifode.org', 'bifode.org'];
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (host) hosts.push(host);
  const site = env('SITE_URL');
  if (site) {
    try {
      hosts.push(new URL(site).host);
    } catch {
      /* ignore malformed SITE_URL */
    }
  }
  hosts.push(...String(env('TRUSTED_HOSTS') || '').split(',').map((h) => h.trim()).filter(Boolean));
  return hosts;
}

/** Same-origin check for state-changing admin POSTs (cookie is also SameSite=Lax). */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const ok = trustedHosts(request).includes(new URL(origin).host);
    if (!ok) console.warn('Admin POST rejected: untrusted origin', { origin, host: request.headers.get('host') });
    return ok;
  } catch {
    return false;
  }
}
