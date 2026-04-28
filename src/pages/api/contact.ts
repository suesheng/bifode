import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const rateLimitStore = new Map<string, number[]>();

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

type Locale = 'de' | 'en';

function createMessages(locale: Locale) {
  if (locale === 'en') {
    return {
      invalidFormat: 'Invalid request format.',
      received: 'Message received.',
      required: 'Please fill in all required fields.',
      invalidEmail: 'Please provide a valid email address.',
      mailNotConfigured: 'Mail service is not configured.',
      mailPrefix: '[EN Contact Form]',
      heading: 'New request via contact form',
      organization: 'Organization',
      email: 'Email',
      time: 'Time',
      message: 'Message',
      subject: 'Subject',
      success: 'Thank you, we have received your request.',
      failure: 'Sending failed. Please try again later.',
      rateLimited: 'Too many requests. Please try again in a few minutes.',
      autoReplySubject: 'We have received your request',
      autoReplyText:
        'Thank you for your message. We have received your request and will get back to you as soon as possible.'
    };
  }

  return {
    invalidFormat: 'Ungültiges Format.',
    received: 'Nachricht empfangen.',
    required: 'Bitte alle Pflichtfelder ausfüllen.',
    invalidEmail: 'Bitte eine gültige E-Mail-Adresse angeben.',
    mailNotConfigured: 'E-Mail-Service ist nicht konfiguriert.',
    mailPrefix: '[Kontaktformular]',
    heading: 'Neue Anfrage über das Kontaktformular',
    organization: 'Organisation',
    email: 'E-Mail',
    time: 'Zeit',
    message: 'Nachricht',
    subject: 'Betreff',
    success: 'Vielen Dank, wir haben Ihre Anfrage erhalten.',
    failure: 'Versand fehlgeschlagen. Bitte später erneut versuchen.',
    rateLimited: 'Zu viele Anfragen. Bitte in einigen Minuten erneut versuchen.',
    autoReplySubject: 'Wir haben Ihre Anfrage erhalten',
    autoReplyText:
      'Vielen Dank für Ihre Nachricht. Wir haben Ihre Anfrage erhalten und melden uns schnellstmöglich bei Ihnen.'
  };
}

function getClientIp(request: Request): string {
  const headerIp =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip');
  if (!headerIp) return 'unknown';
  return headerIp.split(',')[0].trim() || 'unknown';
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

function mapSmtpError(error: unknown, locale: Locale): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code || '') : '';
  const responseCode =
    typeof error === 'object' && error && 'responseCode' in error
      ? Number((error as { responseCode?: number }).responseCode || 0)
      : 0;

  if (code === 'EAUTH' || responseCode === 535) {
    return locale === 'en'
      ? 'SMTP authentication failed. Please check SMTP_USER and SMTP_PASS.'
      : 'SMTP-Authentifizierung fehlgeschlagen. Bitte SMTP_USER und SMTP_PASS prüfen.';
  }

  if (code === 'ESOCKET' || code === 'ETIMEDOUT' || code === 'ECONNECTION') {
    return locale === 'en'
      ? 'SMTP connection failed. Please check SMTP_HOST, SMTP_PORT and network settings.'
      : 'SMTP-Verbindung fehlgeschlagen. Bitte SMTP_HOST, SMTP_PORT und Netzwerkeinstellungen prüfen.';
  }

  return createMessages(locale).failure;
}

export const POST: APIRoute = async ({ request }) => {
  let locale: Locale = 'de';
  try {
    const contentType = request.headers.get('content-type') || '';
    const body = await request.json();
    locale = body?.locale === 'en' ? 'en' : 'de';
    const t = createMessages(locale);
    const clientIp = getClientIp(request);

    if (!contentType.includes('application/json')) {
      return json({ ok: false, message: t.invalidFormat }, 415);
    }

    const name = String(body?.name || '').trim();
    const organization = String(body?.organization || '').trim();
    const email = String(body?.email || '').trim();
    const subject = String(body?.subject || '').trim();
    const message = String(body?.message || '').trim();
    const privacyAccepted = Boolean(body?.privacyAccepted);
    const website = String(body?.website || '').trim(); // honeypot

    if (website) {
      return json({ ok: true, message: t.received });
    }

    if (isRateLimited(clientIp)) {
      return json({ ok: false, message: t.rateLimited }, 429);
    }

    if (!name || !email || !subject || !message || !privacyAccepted) {
      return json({ ok: false, message: t.required }, 400);
    }

    if (!EMAIL_REGEX.test(email)) {
      return json({ ok: false, message: t.invalidEmail }, 400);
    }

    const host = import.meta.env.SMTP_HOST;
    const port = Number(import.meta.env.SMTP_PORT || '587');
    const user = import.meta.env.SMTP_USER;
    const pass = import.meta.env.SMTP_PASS;
    const fromEmail = import.meta.env.CONTACT_FROM_EMAIL || user;
    const toEmail = import.meta.env.CONTACT_TO_EMAIL;

    if (!host || !port || !user || !pass || !fromEmail || !toEmail) {
      console.error('Missing contact mail env vars.');
      return json({ ok: false, message: t.mailNotConfigured }, 500);
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      requireTLS: port !== 465,
      connectionTimeout: 15000
    });

    const safe = (value: string) => value.replace(/[<>&]/g, '');
    const sentAt = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });

    await transporter.sendMail({
      from: `"BiFoDe Kontaktformular" <${fromEmail}>`,
      to: toEmail,
      replyTo: email,
      subject: `${t.mailPrefix} ${subject}`,
      text: [
        `Name: ${name}`,
        `${t.organization}: ${organization || '-'}`,
        `${t.email}: ${email}`,
        `${t.time}: ${sentAt}`,
        '',
        `${t.message}:`,
        message
      ].join('\n'),
      html: `
        <h2>${t.heading}</h2>
        <p><strong>Name:</strong> ${safe(name)}</p>
        <p><strong>${t.organization}:</strong> ${safe(organization || '-')}</p>
        <p><strong>${t.email}:</strong> ${safe(email)}</p>
        <p><strong>${t.time}:</strong> ${safe(sentAt)}</p>
        <p><strong>${t.subject}:</strong> ${safe(subject)}</p>
        <hr />
        <p style="white-space: pre-wrap;">${safe(message)}</p>
      `
    });

    try {
      await transporter.sendMail({
        from: `"BiFoDe e.V." <${fromEmail}>`,
        to: email,
        subject: t.autoReplySubject,
        text: `${t.autoReplyText}\n\nBiFoDe e.V.\ninfo@bifode.org`
      });
    } catch (autoReplyError) {
      console.warn('Auto-reply failed:', autoReplyError);
    }

    return json({ ok: true, message: t.success });
  } catch (error) {
    console.error('Contact API error:', error);
    return json({ ok: false, message: mapSmtpError(error, locale) }, 500);
  }
};
