import nodemailer from 'nodemailer';
import { env } from './env';

export function mailConfigured(): boolean {
  return Boolean(env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASS'));
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

export async function sendMail(opts: { to: string; subject: string; text: string; html?: string; replyTo?: string }) {
  const port = Number(env('SMTP_PORT') || '587');
  const from = env('CONTACT_FROM_EMAIL') || env('SMTP_USER');
  const transporter = nodemailer.createTransport({
    host: env('SMTP_HOST'),
    port,
    secure: port === 465,
    auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') },
    requireTLS: port !== 465,
    connectionTimeout: 15000
  });
  await transporter.sendMail({ from: `"BiFoDe e.V." <${from}>`, ...opts });
}
