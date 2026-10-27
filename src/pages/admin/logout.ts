import type { APIRoute } from 'astro';
import { destroySession, SESSION_COOKIE, sameOrigin } from '../../lib/auth';

export const POST: APIRoute = ({ request, cookies, redirect }) => {
  if (sameOrigin(request)) {
    destroySession(cookies.get(SESSION_COOKIE)?.value);
    cookies.delete(SESSION_COOKIE, { path: '/admin' });
  }
  return redirect('/admin/login', 302);
};
