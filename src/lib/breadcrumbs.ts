export type BreadcrumbCrumb = {
  label: string;
  href?: string;
};

type Locale = 'de' | 'en';

type RouteDef = {
  labelDe: string;
  labelEn: string;
};

/** Static routes (pathname without trailing slash). */
const ROUTES: Record<string, RouteDef> = {
  '/': { labelDe: 'Startseite', labelEn: 'Home' },
  '/en': { labelDe: 'Startseite', labelEn: 'Home' },
  '/ueber-uns': { labelDe: 'Über uns', labelEn: 'About' },
  '/en/about': { labelDe: 'Über uns', labelEn: 'About' },
  '/unsere-arbeit': { labelDe: 'Unsere Arbeit', labelEn: 'Our Work' },
  '/en/our-work': { labelDe: 'Unsere Arbeit', labelEn: 'Our Work' },
  '/kooperation': { labelDe: 'Kooperation', labelEn: 'Cooperation' },
  '/en/cooperation': { labelDe: 'Kooperation', labelEn: 'Cooperation' },
  '/fuer-schulen': { labelDe: 'Schulen', labelEn: 'Schools' },
  '/en/schools': { labelDe: 'Schulen', labelEn: 'Schools' },
  '/schulen': { labelDe: 'Schulen', labelEn: 'Schools' },
  '/projekte': { labelDe: 'Projekte', labelEn: 'Projects' },
  '/en/projects': { labelDe: 'Projekte', labelEn: 'Projects' },
  '/projekte/pilotprojekt-nrw': { labelDe: 'Pilotprojekt NRW', labelEn: 'NRW pilot project' },
  '/projekte/ulpan-next': { labelDe: 'Ulpan Next', labelEn: 'Ulpan Next' },
  '/israel-community': { labelDe: 'Community-Projekt', labelEn: 'Community project' },
  '/israel-hub': { labelDe: 'Israel Hub DACH', labelEn: 'Israel Hub DACH' },
  '/kontakt': { labelDe: 'Kontakt', labelEn: 'Contact' },
  '/en/contact': { labelDe: 'Kontakt', labelEn: 'Contact' },
  '/spenden': { labelDe: 'Spenden', labelEn: 'Donate' },
  '/en/donate': { labelDe: 'Spenden', labelEn: 'Donate' },
  '/mitglied-werden': { labelDe: 'Mitglied werden', labelEn: 'Membership' },
  '/beitrittserklaerung': { labelDe: 'Beitrittserklärung', labelEn: 'Membership declaration' },
  '/en/membership-declaration': {
    labelDe: 'Beitrittserklärung',
    labelEn: 'Membership declaration',
  },
  '/impressum': { labelDe: 'Impressum', labelEn: 'Legal notice' },
  '/en/legal-notice': { labelDe: 'Impressum', labelEn: 'Legal notice' },
  '/datenschutz': { labelDe: 'Datenschutz', labelEn: 'Privacy' },
  '/en/privacy': { labelDe: 'Datenschutz', labelEn: 'Privacy' },
  '/cookie-richtlinien': { labelDe: 'Cookie-Richtlinien', labelEn: 'Cookie policy' },
  '/en/cookie-policy': { labelDe: 'Cookie-Richtlinien', labelEn: 'Cookie policy' },
};

const DYNAMIC_PREFIXES: { prefix: string; parentPath: string }[] = [
  { prefix: '/projekte/', parentPath: '/projekte' },
];

function labelFor(path: string, lang: Locale): string | undefined {
  const def = ROUTES[path];
  if (!def) return undefined;
  return lang === 'en' ? def.labelEn : def.labelDe;
}

function homeCrumb(lang: Locale): BreadcrumbCrumb {
  const href = lang === 'en' ? '/en' : '/';
  const label = lang === 'en' ? 'Home' : 'Startseite';
  return { href, label };
}

function formatSlug(slug: string): string {
  const decoded = decodeURIComponent(slug).replace(/\.md$/, '');
  return decoded
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Build breadcrumb trail for the current page. Home (/ and /en) returns an empty list.
 */
export function buildBreadcrumbs(
  pathname: string,
  lang: Locale,
  pageTitle?: string
): BreadcrumbCrumb[] {
  const path = pathname.replace(/\/$/, '') || '/';

  if (path === '/' || path === '/en') {
    return [];
  }

  const home = homeCrumb(lang);
  const exactLabel = labelFor(path, lang);

  if (exactLabel) {
    return [home, { label: exactLabel }];
  }

  for (const { prefix, parentPath } of DYNAMIC_PREFIXES) {
    if (!path.startsWith(prefix)) continue;

    const parentLabel = labelFor(parentPath, lang);
    if (!parentLabel) continue;

    const slug = path.slice(prefix.length);
    const currentLabel = pageTitle?.trim() || formatSlug(slug);

    return [
      home,
      { href: parentPath, label: parentLabel },
      { label: currentLabel },
    ];
  }

  const fallbackLabel = pageTitle?.trim() || formatSlug(path.split('/').pop() || path);
  return [home, { label: fallbackLabel }];
}
