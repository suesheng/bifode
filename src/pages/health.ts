import type { APIRoute } from 'astro';
import { getDb } from '../lib/db';

export const GET: APIRoute = () => {
  let ok = false;
  try {
    ok = getDb().prepare('SELECT 1 AS ok').get() !== undefined;
  } catch (error) {
    console.error('Health check failed:', error);
  }
  return new Response(JSON.stringify({ ok }), {
    status: ok ? 200 : 503,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
};
