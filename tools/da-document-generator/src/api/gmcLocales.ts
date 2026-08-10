export interface GmcLocale {
  /** Zazzle pricing-endpoint currency param (zcur). */
  zcur: string;
  /** Zazzle pricing-endpoint language param. */
  lang: string;
  /** Zazzle pricing-endpoint region param. */
  region: string;
  /** GMC productAttributes.price currencyCode. */
  currency: string;
  /** GMC feedLabel. */
  feedLabel: string;
  /** GMC contentLanguage. */
  contentLanguage: string;
}

/**
 * Adding a country is one new entry here, not a hunt through call sites — mirrors
 * pdp-gmc-sync's own config/defaults.json pattern (external config, not inline constants).
 */
export const GMC_LOCALES: Record<string, GmcLocale> = {
  us: { zcur: 'USD', lang: 'en', region: 'us', currency: 'USD', feedLabel: 'US', contentLanguage: 'en' },
};

export const DEFAULT_GMC_LOCALE = 'us';
