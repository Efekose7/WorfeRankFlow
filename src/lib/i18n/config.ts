export const SUPPORTED_LOCALES = ['tr', 'en', 'ru', 'ar'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'tr';

export const LOCALE_LABELS: Record<Locale, { label: string; flag: string; dir: 'ltr' | 'rtl' }> = {
  tr: { label: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  en: { label: 'English', flag: '🇺🇸', dir: 'ltr' },
  ru: { label: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  ar: { label: 'العربية', flag: '🇸🇦', dir: 'rtl' },
};

export const HREFLANG_MAP: Record<Locale, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  ru: 'ru-RU',
  ar: 'ar-SA',
};
