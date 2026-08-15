import { DEFAULT_LOCALE, LOCALES, LOCALE_CODES, type Locale } from './config';
import { getToolUrl, getToolIdFromSlug } from '@/data/tools';

// Import all translation files statically for Astro SSG compatibility
import enCommon from './translations/en/common.json';
import enHome from './translations/en/home.json';
import enTools from './translations/en/tools.json';
import enResizer from './translations/en/resizer.json';
import enCmMm from './translations/en/cm-mm-resizer.json';
import enPan from './translations/en/pan-resizer.json';
import enWa from './translations/en/whatsapp-resizer.json';
import enSsc from './translations/en/ssc-resizer.json';
import enYt from './translations/en/youtube-resizer.json';
import enB64 from './translations/en/base64-converter.json';
import enDataUri from './translations/en/data-uri-converter.json';
import enHeic from './translations/en/heic-converter.json';
import enWebp from './translations/en/webp-converter.json';

import esCommon from './translations/es/common.json';
import esHome from './translations/es/home.json';
import esTools from './translations/es/tools.json';
import esResizer from './translations/es/resizer.json';
import esCmMm from './translations/es/cm-mm-resizer.json';
import esPan from './translations/es/pan-resizer.json';
import esWa from './translations/es/whatsapp-resizer.json';
import esSsc from './translations/es/ssc-resizer.json';
import esYt from './translations/es/youtube-resizer.json';
import esB64 from './translations/es/base64-converter.json';
import esDataUri from './translations/es/data-uri-converter.json';
import esHeic from './translations/es/heic-converter.json';
import esWebp from './translations/es/webp-converter.json';

import ptCommon from './translations/pt/common.json';
import ptHome from './translations/pt/home.json';
import ptTools from './translations/pt/tools.json';
import ptResizer from './translations/pt/resizer.json';
import ptCmMm from './translations/pt/cm-mm-resizer.json';
import ptPan from './translations/pt/pan-resizer.json';
import ptWa from './translations/pt/whatsapp-resizer.json';
import ptSsc from './translations/pt/ssc-resizer.json';
import ptYt from './translations/pt/youtube-resizer.json';
import ptB64 from './translations/pt/base64-converter.json';
import ptDataUri from './translations/pt/data-uri-converter.json';
import ptHeic from './translations/pt/heic-converter.json';
import ptWebp from './translations/pt/webp-converter.json';

import frCommon from './translations/fr/common.json';
import frHome from './translations/fr/home.json';
import frTools from './translations/fr/tools.json';
import frResizer from './translations/fr/resizer.json';
import frCmMm from './translations/fr/cm-mm-resizer.json';
import frPan from './translations/fr/pan-resizer.json';
import frWa from './translations/fr/whatsapp-resizer.json';
import frSsc from './translations/fr/ssc-resizer.json';
import frYt from './translations/fr/youtube-resizer.json';
import frB64 from './translations/fr/base64-converter.json';
import frDataUri from './translations/fr/data-uri-converter.json';
import frHeic from './translations/fr/heic-converter.json';
import frWebp from './translations/fr/webp-converter.json';

import deCommon from './translations/de/common.json';
import deHome from './translations/de/home.json';
import deTools from './translations/de/tools.json';
import deResizer from './translations/de/resizer.json';
import deCmMm from './translations/de/cm-mm-resizer.json';
import dePan from './translations/de/pan-resizer.json';
import deWa from './translations/de/whatsapp-resizer.json';
import deSsc from './translations/de/ssc-resizer.json';
import deYt from './translations/de/youtube-resizer.json';
import deB64 from './translations/de/base64-converter.json';
import deDataUri from './translations/de/data-uri-converter.json';
import deHeic from './translations/de/heic-converter.json';
import deWebp from './translations/de/webp-converter.json';

import idCommon from './translations/id/common.json';
import idHome from './translations/id/home.json';
import idTools from './translations/id/tools.json';
import idResizer from './translations/id/resizer.json';
import idCmMm from './translations/id/cm-mm-resizer.json';
import idPan from './translations/id/pan-resizer.json';
import idWa from './translations/id/whatsapp-resizer.json';
import idSsc from './translations/id/ssc-resizer.json';
import idYt from './translations/id/youtube-resizer.json';
import idB64 from './translations/id/base64-converter.json';
import idDataUri from './translations/id/data-uri-converter.json';
import idHeic from './translations/id/heic-converter.json';
import idWebp from './translations/id/webp-converter.json';

import trCommon from './translations/tr/common.json';
import trHome from './translations/tr/home.json';
import trTools from './translations/tr/tools.json';
import trResizer from './translations/tr/resizer.json';
import trCmMm from './translations/tr/cm-mm-resizer.json';
import trPan from './translations/tr/pan-resizer.json';
import trWa from './translations/tr/whatsapp-resizer.json';
import trSsc from './translations/tr/ssc-resizer.json';
import trYt from './translations/tr/youtube-resizer.json';
import trB64 from './translations/tr/base64-converter.json';
import trDataUri from './translations/tr/data-uri-converter.json';
import trHeic from './translations/tr/heic-converter.json';
import trWebp from './translations/tr/webp-converter.json';

import itCommon from './translations/it/common.json';
import itHome from './translations/it/home.json';
import itTools from './translations/it/tools.json';
import itResizer from './translations/it/resizer.json';
import itCmMm from './translations/it/cm-mm-resizer.json';
import itPan from './translations/it/pan-resizer.json';
import itWa from './translations/it/whatsapp-resizer.json';
import itSsc from './translations/it/ssc-resizer.json';
import itYt from './translations/it/youtube-resizer.json';
import itB64 from './translations/it/base64-converter.json';
import itDataUri from './translations/it/data-uri-converter.json';
import itHeic from './translations/it/heic-converter.json';
import itWebp from './translations/it/webp-converter.json';

type TranslationMap = Record<string, string>;

/** All translations indexed by locale, with all namespaces merged into a flat map */
const translations: Record<Locale, TranslationMap> = {
  en: { ...enCommon, ...enHome, ...enTools, ...enResizer, ...enCmMm, ...enPan, ...enWa, ...enSsc, ...enYt, ...enB64, ...enDataUri, ...enHeic, ...enWebp },
  es: { ...esCommon, ...esHome, ...esTools, ...esResizer, ...esCmMm, ...esPan, ...esWa, ...esSsc, ...esYt, ...esB64, ...esDataUri, ...esHeic, ...esWebp },
  pt: { ...ptCommon, ...ptHome, ...ptTools, ...ptResizer, ...ptCmMm, ...ptPan, ...ptWa, ...ptSsc, ...ptYt, ...ptB64, ...ptDataUri, ...ptHeic, ...ptWebp },
  fr: { ...frCommon, ...frHome, ...frTools, ...frResizer, ...frCmMm, ...frPan, ...frWa, ...frSsc, ...frYt, ...frB64, ...frDataUri, ...frHeic, ...frWebp },
  de: { ...deCommon, ...deHome, ...deTools, ...deResizer, ...deCmMm, ...dePan, ...deWa, ...deSsc, ...deYt, ...deB64, ...deDataUri, ...deHeic, ...deWebp },
  id: { ...idCommon, ...idHome, ...idTools, ...idResizer, ...idCmMm, ...idPan, ...idWa, ...idSsc, ...idYt, ...idB64, ...idDataUri, ...idHeic, ...idWebp },
  tr: { ...trCommon, ...trHome, ...trTools, ...trResizer, ...trCmMm, ...trPan, ...trWa, ...trSsc, ...trYt, ...trB64, ...trDataUri, ...trHeic, ...trWebp },
  it: { ...itCommon, ...itHome, ...itTools, ...itResizer, ...itCmMm, ...itPan, ...itWa, ...itSsc, ...itYt, ...itB64, ...itDataUri, ...itHeic, ...itWebp },
};

/**
 * Get a translated string. Throws if the key is missing.
 * NEVER falls back to English. Missing keys = build-time error.
 */
export function t(locale: Locale, key: string): string {
  const map = translations[locale];
  if (!map) {
    throw new Error(`[i18n] Unknown locale: "${locale}"`);
  }
  const value = map[key];
  if (value === undefined || value === '') {
    throw new Error(
      `[i18n] Missing translation for key "${key}" in locale "${locale}". ` +
        `This is a build-breaking error. Add the translation to src/i18n/translations/${locale}/.`
    );
  }
  return value;
}

/**
 * Extract the locale from a URL pathname.
 * Returns DEFAULT_LOCALE ('en') if no locale prefix is found.
 */
export function getLocaleFromUrl(url: URL): Locale {
  const segments = url.pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  if (firstSegment && firstSegment in LOCALES && firstSegment !== DEFAULT_LOCALE) {
    return firstSegment as Locale;
  }
  return DEFAULT_LOCALE;
}

/**
 * Generate a locale-aware path.
 * Dynamically resolves tool URLs with localized slugs when appropriate.
 * 
 * @param path - The base path (e.g., '/', '/tools/', '/tools/image-to-data-uri-converter/')
 * @param locale - The target locale
 */
export function getLocalizedPath(path: string, locale: Locale): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Check if path contains a localized tool slug
  const segments = normalizedPath.split('/').filter(Boolean);
  const possibleSlug = segments.find((seg) => getToolIdFromSlug(seg) !== null);

  if (possibleSlug) {
    const toolId = getToolIdFromSlug(possibleSlug)!;
    return getToolUrl(toolId, locale);
  }

  if (locale === DEFAULT_LOCALE) {
    return normalizedPath;
  }

  // Remove any existing locale prefix first
  let cleanPath = normalizedPath;
  for (const code of LOCALE_CODES) {
    if (code !== DEFAULT_LOCALE && cleanPath.startsWith(`/${code}/`)) {
      cleanPath = cleanPath.slice(code.length + 1);
      break;
    }
    if (code !== DEFAULT_LOCALE && cleanPath === `/${code}`) {
      cleanPath = '/';
      break;
    }
  }

  if (cleanPath === '/') {
    return `/${locale}/`;
  }

  return `/${locale}${cleanPath}`;
}

/**
 * Generate hreflang alternate links for all locales.
 * Used in <head> for SEO.
 * 
 * @param currentPath - The current page path
 */
export function getAlternateLinks(
  currentPath: string
): { locale: string; hreflang: string; href: string }[] {
  const links = LOCALE_CODES.map((code) => ({
    locale: code,
    hreflang: LOCALES[code].hreflang,
    href: `https://imgfeel.com${getLocalizedPath(currentPath, code)}`,
  }));

  links.push({
    locale: 'x-default',
    hreflang: 'x-default',
    href: `https://imgfeel.com${getLocalizedPath(currentPath, DEFAULT_LOCALE)}`,
  });

  return links;
}

/**
 * Get the base path (without locale prefix) from a full URL pathname.
 */
export function getBasePathFromUrl(url: URL): string {
  const segments = url.pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && firstSegment in LOCALES && firstSegment !== DEFAULT_LOCALE) {
    const rest = segments.slice(1).join('/');
    return rest ? `/${rest}/` : '/';
  }

  return url.pathname;
}
