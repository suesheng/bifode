/** Trimmed public env string from import.meta.env, or undefined if empty. */
export function publicEnv(key: string): string | undefined {
  const raw = (import.meta.env as Record<string, unknown>)[key];
  if (typeof raw !== 'string') return undefined;
  const value = raw.trim();
  return value.length > 0 ? value : undefined;
}
