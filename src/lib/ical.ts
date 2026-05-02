import type { CollectionEntry } from 'astro:content';

type EventEntry = CollectionEntry<'events'>;

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function formatUTC(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function buildEventsICS(entries: EventEntry[], opts?: { calname?: string }): string {
  const calname = opts?.calname ?? 'BiFoDe Termine';
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BiFoDe//Events//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(calname)}`,
  ];

  const now = new Date();
  const stamp = formatUTC(now);

  for (const entry of entries) {
    if (entry.data.draft) continue;
    const start = new Date(entry.data.start);
    if (Number.isNaN(start.getTime())) continue;
    let end = entry.data.end ? new Date(entry.data.end) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
    if (Number.isNaN(end.getTime())) end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const uid = `${entry.id.replace(/[^a-zA-Z0-9._-]/g, '-')}-${start.getTime()}@bifode.org`;
    const summary = escapeICS(entry.data.title);
    const desc = escapeICS(entry.data.summary);
    const loc = escapeICS(entry.data.location);
    const url = entry.data.registrationUrl ? escapeICS(entry.data.registrationUrl) : '';

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${formatUTC(start)}`);
    lines.push(`DTEND:${formatUTC(end)}`);
    lines.push(`SUMMARY:${summary}`);
    lines.push(`DESCRIPTION:${desc}`);
    lines.push(`LOCATION:${loc}`);
    if (url) lines.push(`URL:${url}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
