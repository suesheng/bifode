import type { APIRoute } from 'astro';
import { consumeToken, createSession, publicOrigin, SESSION_COOKIE, SESSION_MAX_AGE_S } from '../../lib/auth';

export const GET: APIRoute = ({ request, url, cookies, redirect }) => {
  const email = consumeToken(url.searchParams.get('token') || '');
  if (!email) return redirect('/admin/login', 302);
  cookies.set(SESSION_COOKIE, createSession(email), {
    httpOnly: true,
    sameSite: 'lax',
    secure: publicOrigin(request).startsWith('https://'),
    path: '/admin',
    maxAge: SESSION_MAX_AGE_S
  });
  return redirect('/admin', 302);
};
