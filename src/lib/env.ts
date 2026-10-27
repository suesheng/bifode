// Production runs `node dist/server/entry.mjs` from the project root: load its .env (if any) without
// overriding variables already set in the environment (pod secrets win).
try {
  process.loadEnvFile('.env');
} catch {
  /* no .env file */
}

/** Private env vars: runtime `process.env` first (production on the pod), `import.meta.env` for `astro dev` (.env). */
export function env(name: string): string | undefined {
  const value = process.env[name] ?? (import.meta.env as Record<string, string | undefined> | undefined)?.[name];
  return value === '' ? undefined : value;
}
