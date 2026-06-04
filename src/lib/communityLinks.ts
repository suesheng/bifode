import { publicEnv } from './publicEnv';

/** Official BiFoDe Facebook page. */
export const FB_PAGE_BIFODE = 'https://www.facebook.com/bifode';

/** Ulpan Next project page (Jotform + Meta Pixel). */
export const ULPAN_LANDING_PATH = '/projekte/ulpan-next';

/** Ulpan Next — Bildungsprojekt (Facebook-Gruppe, linked from landing). */
export const FB_GROUP_ULPAN_NEXT = 'https://www.facebook.com/groups/ulpan.next';

/** @deprecated Use FB_GROUP_ULPAN_NEXT; kept for redirects from old bookmarks. */
export const FB_GROUP_ISRAEL_HUB = FB_GROUP_ULPAN_NEXT;

/** Events and community updates (Facebook group). */
export const COMMUNITY_EVENTS_URL = FB_GROUP_ULPAN_NEXT;

export function jotformAnmeldungUrl(): string | undefined {
  const url = publicEnv('PUBLIC_JOTFORM_ANMELDUNG_URL');
  if (!url?.startsWith('http')) return undefined;
  return url;
}

/** Jotform on the Ulpan Next project page (falls back to event registration URL). */
export function jotformUlpanUrl(): string | undefined {
  const ulpan = publicEnv('PUBLIC_JOTFORM_ULPAN_URL');
  if (ulpan?.startsWith('http')) return ulpan;
  return jotformAnmeldungUrl();
}

export function telegramIsraelHubUrl(): string | undefined {
  const url = publicEnv('PUBLIC_TELEGRAM_ISRAEL_HUB_URL');
  if (!url?.startsWith('http')) return undefined;
  return url;
}
