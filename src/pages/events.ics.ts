import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildEventsICS } from '../lib/ical';

export const prerender = true;

export const GET: APIRoute = async () => {
  const all = await getCollection('events');
  const published = all.filter((e) => !e.data.draft);
  const tNow = Date.now();
  const future = published
    .filter((e) => new Date(e.data.start).getTime() >= tNow)
    .sort((a, b) => new Date(a.data.start).getTime() - new Date(b.data.start).getTime());

  const body = buildEventsICS(future, { calname: 'BiFoDe Termine' });

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
