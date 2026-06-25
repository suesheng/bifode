/** Canonical membership fees (annual billing; monthly equivalents for display). */
export const MONTHLY_STANDARD_EUR = 15;
export const MONTHLY_STUDENT_EUR = 12;
export const ANNUAL_STANDARD_EUR = 180;
export const ANNUAL_STUDENT_EUR = 144;
export const ADMISSION_FEE_EUR = 49;

/** @deprecated Use MONTHLY_STANDARD_EUR */
export const MONTHLY_EUR = MONTHLY_STANDARD_EUR;

export function formatEur(amount: number): string {
  return amount.toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function getMembershipFeeAmounts() {
  return {
    monthlyStandard: MONTHLY_STANDARD_EUR,
    monthlyStudent: MONTHLY_STUDENT_EUR,
    annualStandard: ANNUAL_STANDARD_EUR,
    annualStudent: ANNUAL_STUDENT_EUR,
    admissionFee: ADMISSION_FEE_EUR,
  };
}
