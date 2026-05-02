import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { buildEventsICS } from '../../lib/ical';

export const prerender = true;

export async function getStaticPaths() {
  const all = await getCollection('events');
  return all
    .filter((e) => !e.data.draft)
    .map((e) => ({ params: { slug: e.id } }));
}

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;
  if (!slug || typeof slug !== 'string') {
    return new Response('Not found', { status: 404 });
  }

  const entry = await getEntry('events', slug);
  if (!entry || entry.data.draft) {
    return new Response('Not found', { status: 404 });
  }

  const body = buildEventsICS([entry], { calname: entry.data.title });

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
