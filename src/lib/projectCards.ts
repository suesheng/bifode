export const PILOT_LANDING_PATH = '/projekte/pilotprojekt-nrw';

export type ProjectCardStatus = 'active' | 'soon';

export type ProjectCard = {
  id: string;
  titleDe: string;
  titleEn: string;
  descriptionDe: string;
  descriptionEn: string;
  href: string;
  status: ProjectCardStatus;
};

/** Cards on /projekte and /en/projects (order = display order). */
export const PROJECT_CARDS: ProjectCard[] = [
  {
    id: 'pilotprojekt-nrw',
    titleDe: 'Pilotprojekt NRW',
    titleEn: 'NRW Pilot Project',
    descriptionDe:
      'Modulare Formate zu Antisemitismusprävention, Medienkompetenz und demokratischem Zusammenhalt — in Zusammenarbeit mit Schulen.',
    descriptionEn:
      'Modular programmes on antisemitism prevention, media literacy, and democratic cohesion — developed with schools.',
    href: PILOT_LANDING_PATH,
    status: 'active',
  },
  {
    id: 'ulpan-next',
    titleDe: 'Ulpan Next',
    titleEn: 'Ulpan Next',
    descriptionDe:
      'Bildungsprojekt für modernes Hebräisch — Kurse, Community und Moodle-Lernplattform für Mitglieder.',
    descriptionEn:
      'Educational project for modern Hebrew — courses, community, and Moodle learning platform for members.',
    href: '/projekte/ulpan-next',
    status: 'active',
  },
  {
    id: 'digitale-module',
    titleDe: 'Digitale Bildungsmodule',
    titleEn: 'Digital education modules',
    descriptionDe: 'Interaktive Online-Inhalte für Schulen — in Vorbereitung.',
    descriptionEn: 'Interactive online content for schools — in preparation.',
    href: '#',
    status: 'soon',
  },
  {
    id: 'lernstationen',
    titleDe: 'Interaktive Lernstationen',
    titleEn: 'Interactive learning stations',
    descriptionDe: 'Informations- und Lernstationen für Schulen und öffentliche Räume — Konzeptphase.',
    descriptionEn: 'Information and learning stations for schools and public spaces — concept phase.',
    href: '#',
    status: 'soon',
  },
];
