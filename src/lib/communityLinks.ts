import { publicEnv } from './publicEnv';

/** Official BiFoDe Facebook page. */
export const FB_PAGE_BIFODE = 'https://www.facebook.com/bifode';

/** Ulpan Next project page (Jotform + Meta Pixel). */
export const ULPAN_LANDING_PATH = '/projekte/ulpan-next';

export const ULPAN_LANDING_PATH_EN = '/en/projects/ulpan-next';

export function ulpanLandingPath(lang: 'de' | 'en' = 'de'): string {
  return lang === 'en' ? ULPAN_LANDING_PATH_EN : ULPAN_LANDING_PATH;
}

/** Ulpan Next — Bildungsprojekt (Facebook-Gruppe, linked from landing). */
export const FB_GROUP_ULPAN_NEXT = 'https://www.facebook.com/groups/ulpan.next';

/** Israel Hub DACH — deutschsprachige Community zu Aliyah und Alltag in Israel. */
export const FB_GROUP_ISRAEL_HUB_DACH = 'https://www.facebook.com/groups/israel.hub.dach';

/** @deprecated Use FB_GROUP_ISRAEL_HUB_DACH. */
export const FB_GROUP_ISRAEL_HUB = FB_GROUP_ISRAEL_HUB_DACH;

/** Events and community updates (Facebook group). */
export const COMMUNITY_EVENTS_URL = FB_GROUP_ULPAN_NEXT;

/** Membership application on /mitglied-werden (Jotform). */
export const JOTFORM_MITGLIEDSCHAFT_URL =
  'https://form.jotform.com/261744316807056';

export function jotformMitgliedschaftUrl(): string {
  const url = publicEnv('PUBLIC_JOTFORM_MITGLIEDSCHAFT_URL');
  if (url?.startsWith('http')) return url;
  return JOTFORM_MITGLIEDSCHAFT_URL;
}

export function jotformAnmeldungUrl(): string | undefined {
  const url = publicEnv('PUBLIC_JOTFORM_ANMELDUNG_URL');
  if (!url?.startsWith('http')) return undefined;
  return url;
}

/** Ulpan Next interest / registration on /projekte/ulpan-next (Jotform). */
export const JOTFORM_ULPAN_URL = 'https://form.jotform.com/261742322871052';

/** Moodle learning platform for Ulpan.Next members (separate subdomain). */
export const MOODLE_ULPAN_URL = 'https://ulpan.bifode.org/';

export const MOODLE_INFO_PATH = '/moodle';

export function jotformUlpanUrl(): string {
  const ulpan = publicEnv('PUBLIC_JOTFORM_ULPAN_URL');
  if (ulpan?.startsWith('http')) return ulpan;
  return JOTFORM_ULPAN_URL;
}

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
