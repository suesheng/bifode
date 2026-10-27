/** Private env vars: runtime `process.env` first (production on the pod), `import.meta.env` for `astro dev` (.env). */
export function env(name: string): string | undefined {
  const value = process.env[name] ?? (import.meta.env as Record<string, string | undefined>)[name];
  return value === '' ? undefined : value;
}
