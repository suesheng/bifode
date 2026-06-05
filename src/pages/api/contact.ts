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
      membershipSuccess:
        'Thank you — we have received your membership application. We will contact you shortly with the next steps.',
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
    membershipSuccess:
      'Vielen Dank — wir haben Ihre Anfrage auf Mitgliedschaft erhalten. Wir melden uns in Kürze mit den nächsten Schritten zur Aufnahme.',
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
    console.error('SMTP authentication failed.');
    return createMessages(locale).failure;
  }

  if (code === 'ESOCKET' || code === 'ETIMEDOUT' || code === 'ECONNECTION') {
    console.error('SMTP connection failed.');
    return createMessages(locale).failure;
  }

  return createMessages(locale).failure;
}

export const POST: APIRoute = async ({ request }) => {
  let locale: Locale = 'de';
  try {
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      return json({ ok: false, message: createMessages(locale).invalidFormat }, 415);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, message: createMessages(locale).invalidFormat }, 400);
    }

    locale = body?.locale === 'en' ? 'en' : 'de';
    const t = createMessages(locale);
    const clientIp = getClientIp(request);

    const formSource = String(body?.formSource || '').trim();
    const isIsraelCommunity = formSource === 'israel_community';
    const isMembership = formSource === 'mitgliedschaft';

    let name = String(body?.name || '').trim();
    const firstName = String(body?.firstName || '').trim();
    const lastName = String(body?.lastName || '').trim();
    if (!name && firstName && lastName) {
      name = `${firstName} ${lastName}`.trim();
    }
    const organization = String(body?.organization || '').trim();
    const email = String(body?.email || '').trim();
    let subject = String(body?.subject || '').trim();
    const message = String(body?.message || '').trim();
    const privacyAccepted = Boolean(body?.privacyAccepted);
    const website = String(body?.website || '').trim(); // honeypot

    const phone = String(body?.phone || '').trim();
    const street = String(body?.street || '').trim();
    const postalCode = String(body?.postalCode || '').trim();
    const city = String(body?.city || '').trim();
    const membershipTariff = String(body?.membershipTariff || '').trim();
    let membershipType = String(body?.membershipType || '').trim();
    const billing = String(body?.billing || '').trim() || membershipType;
    let isStudent = Boolean(body?.isStudent);
    if (membershipTariff.includes('student')) {
      isStudent = true;
    } else if (membershipTariff) {
      isStudent = false;
    }
    const admissionAccepted = Boolean(body?.admissionAccepted);
    const interests = Array.isArray(body?.interests)
      ? body.interests.map((o) => String(o).trim()).filter(Boolean)
      : [];
    const interest = String(body?.interest || '').trim();
    const offers = Array.isArray(body?.offers)
      ? body.offers.map((o) => String(o).trim()).filter(Boolean)
      : [];
    const newsletter = Boolean(body?.newsletter);
    const utmSource = String(body?.utm_source || '').trim();
    const utmMedium = String(body?.utm_medium || '').trim();
    const utmCampaign = String(body?.utm_campaign || '').trim();
    const utmContent = String(body?.utm_content || '').trim();
    const utmTerm = String(body?.utm_term || '').trim();
    const pageSource = String(body?.page_source || '').trim();

    if (website) {
      return json({ ok: true, message: t.received });
    }

    if (isRateLimited(clientIp)) {
      return json({ ok: false, message: t.rateLimited }, 429);
    }

    if (isIsraelCommunity) {
      if (!firstName || !lastName || !email || !message || !privacyAccepted || !interest) {
        return json({ ok: false, message: t.required }, 400);
      }
      if (!subject) {
        subject = `[Israel Community] ${interest}`;
      }
    } else if (isMembership) {
      if (!membershipType && membershipTariff) {
        membershipType = membershipTariff;
      }
      if (
        !firstName ||
        !lastName ||
        !email ||
        !privacyAccepted ||
        !admissionAccepted ||
        !membershipType ||
        !street ||
        !postalCode ||
        !city
      ) {
        return json({ ok: false, message: t.required }, 400);
      }
      if (!subject) {
        subject = `[Mitgliedschaft] ${membershipType}${isStudent ? ' · Studierende' : ''}`;
      }
    } else if (!name || !email || !subject || !message || !privacyAccepted) {
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

    const mailPrefix = isIsraelCommunity
      ? '[Israel Community]'
      : isMembership
        ? '[Mitgliedschaft]'
        : t.mailPrefix;

    const membershipExtraLines = isMembership
      ? [
          `Vorname: ${firstName}`,
          `Nachname: ${lastName}`,
          `Telefon: ${phone || '-'}`,
          `Straße: ${street || '-'}`,
          `PLZ: ${postalCode}`,
          `Ort: ${city}`,
          `Mitgliedsbeitrag: ${membershipType}`,
          `Studierenden-Ermäßigung: ${isStudent ? 'ja (Nachweis folgt)' : 'nein'}`,
          `Aufnahme beantragt: ja`,
          `Interessen: ${interests.length ? interests.join(', ') : '-'}`,
          `Newsletter: ${newsletter ? 'ja' : 'nein'}`,
          `Quelle: ${pageSource || '-'}`
        ]
      : [];

    const israelExtraLines = isIsraelCommunity
      ? [
          `Vorname: ${firstName}`,
          `Nachname: ${lastName}`,
          `Telefon/WhatsApp: ${phone || '-'}`,
          `Stadt: ${city || '-'}`,
          `Interessensbereich: ${interest}`,
          `Angebote: ${offers.length ? offers.join(', ') : '-'}`,
          `Newsletter: ${newsletter ? 'ja' : 'nein'}`,
          ...(utmSource || utmMedium || utmCampaign
            ? [
                '',
                'UTM (intern):',
                `utm_source: ${utmSource || '-'}`,
                `utm_medium: ${utmMedium || '-'}`,
                `utm_campaign: ${utmCampaign || '-'}`,
                `utm_content: ${utmContent || '-'}`,
                `utm_term: ${utmTerm || '-'}`,
                `page_source: ${pageSource || '-'}`
              ]
            : [])
        ]
      : [];

    const textBody = [
      `Name: ${name}`,
      ...(isIsraelCommunity
        ? israelExtraLines
        : isMembership
          ? membershipExtraLines
          : [`${t.organization}: ${organization || '-'}`]),
      `${t.email}: ${email}`,
      `${t.time}: ${sentAt}`,
      '',
      `${t.message}:`,
      message || '-'
    ].join('\n');

    const htmlExtra = isIsraelCommunity
      ? `
        <p><strong>Vorname:</strong> ${safe(firstName)}</p>
        <p><strong>Nachname:</strong> ${safe(lastName)}</p>
        <p><strong>Telefon/WhatsApp:</strong> ${safe(phone || '-')}</p>
        <p><strong>Stadt:</strong> ${safe(city || '-')}</p>
        <p><strong>Interessensbereich:</strong> ${safe(interest)}</p>
        <p><strong>Angebote:</strong> ${safe(offers.length ? offers.join(', ') : '-')}</p>
        <p><strong>Newsletter:</strong> ${newsletter ? 'ja' : 'nein'}</p>
      `
      : isMembership
        ? `
        <p><strong>Vorname:</strong> ${safe(firstName)}</p>
        <p><strong>Nachname:</strong> ${safe(lastName)}</p>
        <p><strong>Telefon:</strong> ${safe(phone || '-')}</p>
        <p><strong>Adresse:</strong> ${safe(street || '-')}, ${safe(postalCode)} ${safe(city)}</p>
        <p><strong>Mitgliedsbeitrag:</strong> ${safe(membershipType)}</p>
        <p><strong>Studierenden-Ermäßigung:</strong> ${safe(isStudent ? 'ja (Nachweis folgt)' : 'nein')}</p>
        <p><strong>Aufnahme beantragt:</strong> ja</p>
        <p><strong>Interessen:</strong> ${safe(interests.length ? interests.join(', ') : '-')}</p>
        <p><strong>Newsletter:</strong> ${newsletter ? 'ja' : 'nein'}</p>
      `
        : `<p><strong>${t.organization}:</strong> ${safe(organization || '-')}</p>`;

    const mailHeading = isIsraelCommunity
      ? 'Neue Anfrage — Israel Community Deutschland'
      : isMembership
        ? 'Neue Mitgliedschaftsanfrage — BiFoDe e.V.'
        : t.heading;

    await transporter.sendMail({
      from: `"BiFoDe Kontaktformular" <${fromEmail}>`,
      to: toEmail,
      replyTo: email,
      subject: `${mailPrefix} ${subject}`,
      text: textBody,
      html: `
        <h2>${mailHeading}</h2>
        <p><strong>Name:</strong> ${safe(name)}</p>
        ${htmlExtra}
        <p><strong>${t.email}:</strong> ${safe(email)}</p>
        <p><strong>${t.time}:</strong> ${safe(sentAt)}</p>
        <p><strong>${t.subject}:</strong> ${safe(subject)}</p>
        <hr />
        <p style="white-space: pre-wrap;">${safe(message || '-')}</p>
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

    return json({
      ok: true,
      message: isMembership ? t.membershipSuccess : t.success
    });
  } catch (error) {
    console.error('Contact API error:', error);
    return json({ ok: false, message: mapSmtpError(error, locale) }, 500);
  }
};
