import { publicEnv } from './publicEnv';

/** Official BiFoDe Facebook page. */
export const FB_PAGE_BIFODE = 'https://www.facebook.com/bifode';

/** Ulpan Ivrit project page (Meta Pixel). */
export const ULPAN_LANDING_PATH = '/projekte/ulpan-next';

export const ULPAN_LANDING_PATH_EN = '/en/projects/ulpan-next';

export function ulpanLandingPath(lang: 'de' | 'en' = 'de'): string {
  return lang === 'en' ? ULPAN_LANDING_PATH_EN : ULPAN_LANDING_PATH;
}

/** Ulpan Ivrit — Bildungsprojekt (Facebook-Gruppe, linked from landing). */
export const FB_GROUP_ULPAN_NEXT = 'https://www.facebook.com/groups/ulpan.next';

/** Israel Hub DACH — deutschsprachige Community zu Aliyah und Alltag in Israel. */
export const FB_GROUP_ISRAEL_HUB_DACH = 'https://www.facebook.com/groups/israel.hub.dach';

/** @deprecated Use FB_GROUP_ISRAEL_HUB_DACH. */
export const FB_GROUP_ISRAEL_HUB = FB_GROUP_ISRAEL_HUB_DACH;

/** Events and community updates (Facebook group). */
export const COMMUNITY_EVENTS_URL = FB_GROUP_ULPAN_NEXT;

/** Own membership application form (stored on this site, reviewed in /admin). */
export const MEMBERSHIP_APPLY_PATH = '/mitglied-werden/antrag';

export const MEMBERSHIP_APPLY_PATH_EN = '/en/membership/apply';

export function membershipApplyPath(lang: 'de' | 'en' = 'de'): string {
  return lang === 'en' ? MEMBERSHIP_APPLY_PATH_EN : MEMBERSHIP_APPLY_PATH;
}

/** Moodle learning platform for Ulpan Ivrit members (separate subdomain). */
export const MOODLE_ULPAN_URL = 'https://ulpan.bifode.org/';

export const MOODLE_INFO_PATH = '/moodle';

export function moodleUlpanUrl(): string {
  const url = publicEnv('PUBLIC_MOODLE_ULPAN_URL');
  if (url?.startsWith('http')) return url;
  return MOODLE_ULPAN_URL;
}

export function telegramIsraelHubUrl(): string | undefined {
  const url = publicEnv('PUBLIC_TELEGRAM_ISRAEL_HUB_URL');
  if (!url?.startsWith('http')) return undefined;
  return url;
}
