import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';
import { env } from '../../lib/env';
import { escapeHtml, mailConfigured, sendMail } from '../../lib/mail';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const rateLimitStore = new Map<string, number[]>();

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (rateLimitStore.get(ip) || []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitStore.set(ip, recent);
    return true;
  }
  recent.push(now);
  rateLimitStore.set(ip, recent);
  return false;
}

const text = {
  de: {
    invalid: 'Ungültiges Format.',
    required: 'Bitte alle Pflichtfelder ausfüllen.',
    email: 'Bitte eine gültige E-Mail-Adresse angeben.',
    limited: 'Zu viele Anfragen. Bitte in einigen Minuten erneut versuchen.',
    ok: 'Vielen Dank — wir haben Ihren Mitgliedsantrag erhalten. Der Vorstand prüft ihn; wir melden uns per E-Mail.',
    replySubject: 'Ihr Mitgliedsantrag bei BiFoDe e.V.',
    reply:
      'Vielen Dank für Ihren Antrag auf Mitgliedschaft. Er ist bei uns eingegangen und wird vom Vorstand geprüft. Wir melden uns per E-Mail.'
  },
  en: {
    invalid: 'Invalid request format.',
    required: 'Please fill in all required fields.',
    email: 'Please provide a valid email address.',
    limited: 'Too many requests. Please try again in a few minutes.',
    ok: 'Thank you — we have received your membership application. The board will review it and we will contact you by email.',
    replySubject: 'Your membership application at BiFoDe e.V.',
    reply:
      'Thank you for applying for membership. We have received your application and the board will review it. We will contact you by email.'
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!(request.headers.get('content-type') || '').includes('application/json')) {
    return json({ ok: false, message: text.de.invalid }, 415);
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: text.de.invalid }, 400);
  }
  const locale = body?.locale === 'en' ? 'en' : 'de';
  const t = text[locale];
  const s = (k: string) => String(body?.[k] || '').trim().slice(0, 300);

  if (s('website')) return json({ ok: true, message: t.ok }); // honeypot

  const ip = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();
  if (isRateLimited(ip)) return json({ ok: false, message: t.limited }, 429);

  const m = {
    firstName: s('firstName'),
    lastName: s('lastName'),
    email: s('email'),
    phone: s('phone'),
    street: s('street'),
    postalCode: s('postalCode'),
    city: s('city'),
    newsletter: Boolean(body?.newsletter)
  };
  if (
    !m.firstName || !m.lastName || !m.email || !m.street || !m.postalCode || !m.city ||
    !body?.privacyAccepted || !body?.admissionAccepted
  ) {
    return json({ ok: false, message: t.required }, 400);
  }
  if (!EMAIL_REGEX.test(m.email)) return json({ ok: false, message: t.email }, 400);

  getDb()
    .prepare(
      `INSERT INTO members (first_name, last_name, email, phone, street, postal_code, city, newsletter, locale, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(m.firstName, m.lastName, m.email, m.phone, m.street, m.postalCode, m.city, m.newsletter ? 1 : 0, locale, new Date().toISOString());

  // The stored application is the source of truth; mail problems must not lose it or fail the request.
  if (mailConfigured()) {
    const to = env('CONTACT_TO_EMAIL');
    try {
      if (to) {
        await sendMail({
          to,
          replyTo: m.email,
          subject: `[Mitgliedschaft] ${m.firstName} ${m.lastName}`,
          text: `Neuer Mitgliedsantrag von ${m.firstName} ${m.lastName} (${m.email}). Bitte im Admin-Bereich prüfen.`,
          html: `<p>Neuer Mitgliedsantrag von <strong>${escapeHtml(m.firstName)} ${escapeHtml(m.lastName)}</strong> (${escapeHtml(m.email)}). Bitte im Admin-Bereich prüfen.</p>`
        });
      }
      await sendMail({ to: m.email, subject: t.replySubject, text: `${t.reply}\n\nBiFoDe e.V.\ninfo@bifode.org` });
    } catch (error) {
      console.warn('Membership mail failed:', error);
    }
  } else {
    console.warn('Membership application stored, but SMTP is not configured: no mails sent.');
  }

  return json({ ok: true, message: t.ok });
};
