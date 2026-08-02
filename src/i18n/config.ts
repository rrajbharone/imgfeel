export const DEFAULT_LOCALE = 'en' as const;

export const LOCALES = {
  en: { label: 'English', hreflang: 'en' },
  es: { label: 'Español', hreflang: 'es' },
  pt: { label: 'Português', hreflang: 'pt' },
  fr: { label: 'Français', hreflang: 'fr' },
  de: { label: 'Deutsch', hreflang: 'de' },
  id: { label: 'Bahasa Indonesia', hreflang: 'id' },
  tr: { label: 'Türkçe', hreflang: 'tr' },
  it: { label: 'Italiano', hreflang: 'it' },
} as const;

export type Locale = keyof typeof LOCALES;

export const LOCALE_CODES = Object.keys(LOCALES) as Locale[];

export const NON_DEFAULT_LOCALES = LOCALE_CODES.filter(
  (code) => code !== DEFAULT_LOCALE
) as Exclude<Locale, typeof DEFAULT_LOCALE>[];

/** Translation namespace filenames (without .json) */
export const TRANSLATION_NAMESPACES = [
  'common',
  'home',
  'tools',
  'resizer',
  'cm-mm-resizer',
  'pan-resizer',
  'whatsapp-resizer',
  'ssc-resizer',
  'youtube-resizer',
  'base64-converter',
  'data-uri-converter',
] as const;

export type TranslationNamespace = (typeof TRANSLATION_NAMESPACES)[number];
