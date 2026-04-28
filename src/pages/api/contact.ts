import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return json({ ok: false, message: 'Ungültiges Format.' }, 415);
    }

    const body = await request.json();
    const name = String(body?.name || '').trim();
    const organization = String(body?.organization || '').trim();
    const email = String(body?.email || '').trim();
    const subject = String(body?.subject || '').trim();
    const message = String(body?.message || '').trim();
    const privacyAccepted = Boolean(body?.privacyAccepted);
    const website = String(body?.website || '').trim(); // honeypot

    if (website) {
      return json({ ok: true, message: 'Nachricht empfangen.' });
    }

    if (!name || !email || !subject || !message || !privacyAccepted) {
      return json({ ok: false, message: 'Bitte alle Pflichtfelder ausfüllen.' }, 400);
    }

    if (!EMAIL_REGEX.test(email)) {
      return json({ ok: false, message: 'Bitte eine gültige E-Mail-Adresse angeben.' }, 400);
    }

    const host = import.meta.env.SMTP_HOST;
    const port = Number(import.meta.env.SMTP_PORT || '587');
    const user = import.meta.env.SMTP_USER;
    const pass = import.meta.env.SMTP_PASS;
    const fromEmail = import.meta.env.CONTACT_FROM_EMAIL || user;
    const toEmail = import.meta.env.CONTACT_TO_EMAIL;

    if (!host || !port || !user || !pass || !fromEmail || !toEmail) {
      console.error('Missing contact mail env vars.');
      return json({ ok: false, message: 'E-Mail-Service ist nicht konfiguriert.' }, 500);
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    const safe = (value: string) => value.replace(/[<>&]/g, '');
    const sentAt = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });

    await transporter.sendMail({
      from: `"BiFoDe Kontaktformular" <${fromEmail}>`,
      to: toEmail,
      replyTo: email,
      subject: `[Kontaktformular] ${subject}`,
      text: [
        `Name: ${name}`,
        `Organisation: ${organization || '-'}`,
        `E-Mail: ${email}`,
        `Zeit: ${sentAt}`,
        '',
        'Nachricht:',
        message
      ].join('\n'),
      html: `
        <h2>Neue Anfrage über das Kontaktformular</h2>
        <p><strong>Name:</strong> ${safe(name)}</p>
        <p><strong>Organisation:</strong> ${safe(organization || '-')}</p>
        <p><strong>E-Mail:</strong> ${safe(email)}</p>
        <p><strong>Zeit:</strong> ${safe(sentAt)}</p>
        <p><strong>Betreff:</strong> ${safe(subject)}</p>
        <hr />
        <p style="white-space: pre-wrap;">${safe(message)}</p>
      `
    });

    return json({ ok: true, message: 'Vielen Dank, wir haben Ihre Anfrage erhalten.' });
  } catch (error) {
    console.error('Contact API error:', error);
    return json({ ok: false, message: 'Versand fehlgeschlagen. Bitte später erneut versuchen.' }, 500);
  }
};
