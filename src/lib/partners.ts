/**
 * Partner logos for the homepage trust section.
 *
 * To add a partner:
 * 1. Drop the logo file into `src/assets/partners/` (jpg, png, or webp).
 * 2. Append an entry below with matching `logoFile` name.
 *
 * Logos are resized at build time and shown on a white tile (transparent PNGs included).
 */
export type Partner = {
  /** Stable id (optional, for future use) */
  id: string;
  /** Display name (EN pages and default) */
  name: string;
  /** Optional German display name */
  nameDe?: string;
  /** Filename inside `src/assets/partners/` */
  logoFile: string;
  /** Optional accessible logo description */
  logoAlt?: string;
  /** Optional partner website */
  href?: string;
};

export const partners: Partner[] = [
  {
    id: 'wzo',
    name: 'The World Zionist Organization',
    logoFile: 'wzo.webp',
    logoAlt: 'World Zionist Organization — Department for the Promotion of Aliyah',
  },
  {
    id: 'jgd',
    name: 'Jewish Community of Düsseldorf',
    nameDe: 'Jüdische Gemeinde Düsseldorf',
    logoFile: 'jgd.webp',
    logoAlt: 'Jüdische Gemeinde Düsseldorf',
  },
  {
    id: 'mgd',
    name: 'Maliki Community Düsseldorf',
    nameDe: 'Malikitische Gemeinde Düsseldorf',
    logoFile: 'mgd.webp',
    logoAlt: 'Malikitische Gemeinde Düsseldorf',
  },
];