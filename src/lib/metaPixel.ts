/**
 * Meta Pixel helpers — only call after marketing cookie consent.
 * Do not pass form fields, interests, or other personal/sensitive data to Meta.
 */

export type MetaConsent = {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  updatedAt: number;
};

export const COOKIE_STORAGE_KEY = 'cookie-consent-v1';

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
    __bifodeMetaPixelInitialized?: boolean;
  }
}

type Fbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  loaded?: boolean;
  version?: string;
  push: Fbq;
};

export function readMarketingConsent(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const saved = localStorage.getItem(COOKIE_STORAGE_KEY);
    if (!saved) return false;
    const parsed = JSON.parse(saved) as MetaConsent;
    return Boolean(parsed.marketing);
  } catch {
    return false;
  }
}

export function getMetaPixelId(): string | null {
  const id = import.meta.env.PUBLIC_META_PIXEL_ID;
  if (!id || id === 'TODO_META_PIXEL_ID' || id.startsWith('TODO')) return null;
  return String(id).trim();
}

export function loadMetaPixelScript(pixelId: string): void {
  if (typeof window === 'undefined' || window.__bifodeMetaPixelInitialized) return;

  const existing = window.fbq;
  if (!existing) {
    const n: Fbq = function (...args: unknown[]) {
      if (n.callMethod) {
        n.callMethod.apply(n, args);
      } else {
        n.queue.push(args);
      }
    } as Fbq;
    n.queue = [];
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    window.fbq = n;
    window._fbq = n;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    const first = document.getElementsByTagName('script')[0];
    first?.parentNode?.insertBefore(script, first);
  }

  window.fbq?.('init', pixelId);
  window.__bifodeMetaPixelInitialized = true;
}

export function trackMetaPageView(): void {
  if (!readMarketingConsent() || !getMetaPixelId()) return;
  window.fbq?.('track', 'PageView');
}

export function trackMetaStandard(event: string, params?: Record<string, string>): void {
  if (!readMarketingConsent() || !getMetaPixelId()) return;
  if (params) {
    window.fbq?.('track', event, params);
  } else {
    window.fbq?.('track', event);
  }
}

export function trackMetaCustom(event: string, params?: Record<string, string>): void {
  if (!readMarketingConsent() || !getMetaPixelId()) return;
  if (params) {
    window.fbq?.('trackCustom', event, params);
  } else {
    window.fbq?.('trackCustom', event);
  }
}

export function ensureMetaPixelReady(): boolean {
  const pixelId = getMetaPixelId();
  if (!pixelId || !readMarketingConsent()) return false;
  loadMetaPixelScript(pixelId);
  return true;
}
