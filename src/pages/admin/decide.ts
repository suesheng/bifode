import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';
import { sameOrigin, sessionEmail } from '../../lib/auth';
import { mailConfigured, sendMail } from '../../lib/mail';

const mails = {
  de: {
    active: ['Ihre Mitgliedschaft bei BiFoDe e.V.', 'Der Vorstand hat Ihren Antrag angenommen. Herzlich willkommen bei BiFoDe e.V.!'],
    rejected: ['Ihr Mitgliedsantrag bei BiFoDe e.V.', 'Der Vorstand hat Ihren Antrag leider nicht angenommen. Bei Fragen schreiben Sie uns gern.']
  },
  en: {
    active: ['Your membership at BiFoDe e.V.', 'The board has accepted your application. Welcome to BiFoDe e.V.!'],
    rejected: ['Your membership application at BiFoDe e.V.', 'The board has unfortunately not accepted your application. Please get in touch if you have questions.']
  }
};

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (!sameOrigin(request) || !sessionEmail(cookies)) return new Response('Forbidden', { status: 403 });
  const form = await request.formData();
  const id = Number(form.get('id'));
  const status = String(form.get('status'));
  if (!Number.isInteger(id) || !['active', 'rejected', 'left', 'pending'].includes(status)) {
    return new Response('Bad request', { status: 400 });
  }
  const db = getDb();
  const m = db.prepare('SELECT email, locale FROM members WHERE id = ?').get(id) as { email: string; locale: 'de' | 'en' } | undefined;
  if (!m) return new Response('Not found', { status: 404 });
  db.prepare('UPDATE members SET status = ?, decided_at = ? WHERE id = ?').run(status, new Date().toISOString(), id);
  if (form.get('notify') === '1' && (status === 'active' || status === 'rejected') && mailConfigured()) {
    const [subject, body] = mails[m.locale][status];
    try {
      await sendMail({ to: m.email, subject, text: `${body}\n\nBiFoDe e.V.\ninfo@bifode.org` });
    } catch (error) {
      console.warn('Decision mail failed:', error);
    }
  }
  return redirect(`/admin?status=${encodeURIComponent(String(form.get('back') || 'pending'))}`, 303);
};
