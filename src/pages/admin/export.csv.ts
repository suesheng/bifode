import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';
import { sessionEmail } from '../../lib/auth';

const cell = (v: unknown) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralize spreadsheet formulas
  return `"${s.replace(/"/g, '""')}"`;
};

export const GET: APIRoute = ({ cookies }) => {
  if (!sessionEmail(cookies)) return new Response('Forbidden', { status: 403 });
  const rows = getDb().prepare('SELECT * FROM members ORDER BY id').all() as Record<string, unknown>[];
  const cols = ['id', 'status', 'first_name', 'last_name', 'email', 'phone', 'street', 'postal_code', 'city', 'newsletter', 'locale', 'created_at', 'decided_at'];
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n');
  return new Response('﻿' + csv, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="mitglieder.csv"' }
  });
};
