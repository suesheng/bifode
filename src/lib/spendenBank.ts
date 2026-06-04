import { publicEnv } from './publicEnv';

/** Default donation account (overridable via PUBLIC_SPENDEN_* in .env). */
export const DEFAULT_SPENDEN_BANK = {
  bank: 'Sparkasse',
  iban: 'DE44 3425 0000 1000 1612 89',
  blz: '34250000',
  accountHolder: 'BiFoDe e.V.',
  paymentReferenceDe: 'Spende BiFoDe e.V.',
  paymentReferenceEn: 'Donation BiFoDe e.V.',
} as const;

export type SpendenBankDetails = {
  iban: string;
  bankName: string;
  blz: string | undefined;
  bic: string | undefined;
  accountHolder: string;
  paymentReference: string;
  hasBankDetails: boolean;
};

export function getSpendenBankDetails(lang: 'de' | 'en' = 'de'): SpendenBankDetails {
  const ibanRaw = publicEnv('PUBLIC_SPENDEN_IBAN') ?? DEFAULT_SPENDEN_BANK.iban;
  const iban = ibanRaw.replace(/\s+/g, ' ').trim();
  const bankName = publicEnv('PUBLIC_SPENDEN_BANK') ?? DEFAULT_SPENDEN_BANK.bank;
  const blz = publicEnv('PUBLIC_SPENDEN_BLZ') ?? DEFAULT_SPENDEN_BANK.blz;
  const bic = publicEnv('PUBLIC_SPENDEN_BIC');
  const accountHolder =
    publicEnv('PUBLIC_SPENDEN_KONTOINHABER') ?? DEFAULT_SPENDEN_BANK.accountHolder;
  const paymentReference =
    publicEnv('PUBLIC_SPENDEN_VERWENDUNGSZWECK') ??
    (lang === 'en'
      ? DEFAULT_SPENDEN_BANK.paymentReferenceEn
      : DEFAULT_SPENDEN_BANK.paymentReferenceDe);

  return {
    iban,
    bankName,
    blz,
    bic,
    accountHolder,
    paymentReference,
    hasBankDetails: iban.length > 0,
  };
}
