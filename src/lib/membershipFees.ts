export const MONTHLY_EUR = 15;
export const STUDENT_DISCOUNT = 0.3;
export const ANNUAL_DISCOUNT = 0.1;

export function formatEur(amount: number): string {
  return amount.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function getMembershipFeeAmounts() {
  const monthlyStudent =
    Math.round(MONTHLY_EUR * (1 - STUDENT_DISCOUNT) * 100) / 100;
  const annualStandard =
    Math.round(MONTHLY_EUR * 12 * (1 - ANNUAL_DISCOUNT) * 100) / 100;
  const annualStudent =
    Math.round(monthlyStudent * 12 * (1 - ANNUAL_DISCOUNT) * 100) / 100;
  const annualStandardFull = MONTHLY_EUR * 12;
  const annualStudentFull = Math.round(monthlyStudent * 12 * 100) / 100;

  return {
    monthlyStudent,
    annualStandard,
    annualStudent,
    annualStandardFull,
    annualStudentFull,
  };
}
