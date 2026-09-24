/**
 * Canonical fees.
 * Membership in BiFoDe e.V. is free of charge (Beitragsordnung).
 * Course fees (Teilnahmeentgelte) are set by the board in the Entgeltordnung.
 */
export const MEMBERSHIP_FEE_EUR = 0;

/** Ulpan Ivrit: fee per teaching unit (45 min.). */
export const ULPAN_UE_MEMBER_EUR = 8;
export const ULPAN_UE_NON_MEMBER_EUR = 16;
/** Ulpan Ivrit Düsseldorf A1: 60 UE, 8 monthly instalments. */
export const ULPAN_COURSE_UE = 60;
export const ULPAN_COURSE_MEMBER_EUR = 480;
export const ULPAN_COURSE_NON_MEMBER_EUR = 960;
export const ULPAN_RATE_MEMBER_EUR = 60;
export const ULPAN_RATE_NON_MEMBER_EUR = 120;

export function formatEur(amount: number): string {
  return amount.toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
