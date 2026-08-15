import type { Locale } from '@/i18n/config';
import { t } from '@/i18n/utils';

export const TOOL_SLUGS: Record<string, Record<Locale, string>> = {
  'cm-mm-resizer': {
    en: 'resize-image-in-cm-mm',
    es: 'redimensionar-imagen-en-cm-mm',
    pt: 'redimensionar-imagem-em-cm-mm',
    fr: 'redimensionner-image-en-cm-mm',
    de: 'bild-in-cm-mm-verkleinern',
    id: 'ubah-ukuran-gambar-dalam-cm-mm',
    tr: 'resmi-cm-mm-olarak-yeniden-boyutlandir',
    it: 'ridimensiona-immagine-in-cm-mm',
  },
  'pan-card-resizer': {
    en: 'pan-card-image-resizer',
    es: 'redimensionar-imagen-tarjeta-pan',
    pt: 'redimensionar-imagem-cartao-pan',
    fr: 'redimensionner-image-carte-pan',
    de: 'pan-karten-bild-verkleinern',
    id: 'ubah-ukuran-gambar-kartu-pan',
    tr: 'pan-karti-resim-boyutlandirma',
    it: 'ridimensiona-immagine-carta-pan',
  },
  'whatsapp-dp-resizer': {
    en: 'whatsapp-dp-resizer',
    es: 'redimensionar-foto-perfil-whatsapp',
    pt: 'redimensionar-foto-perfil-whatsapp',
    fr: 'redimensionner-photo-profil-whatsapp',
    de: 'whatsapp-profilbild-verkleinern',
    id: 'ubah-ukuran-foto-profil-whatsapp',
    tr: 'whatsapp-profil-resmi-boyutlandirma',
    it: 'ridimensiona-foto-profilo-whatsapp',
  },
  'ssc-photo-signature-resizer': {
    en: 'ssc-photo-signature-resizer',
    es: 'redimensionar-foto-firma-ssc',
    pt: 'redimensionar-foto-assinatura-ssc',
    fr: 'redimensionner-photo-signature-ssc',
    de: 'ssc-foto-unterschrift-verkleinern',
    id: 'ubah-ukuran-foto-tanda-tangan-ssc',
    tr: 'ssc-fotograf-imza-boyutlandirma',
    it: 'ridimensiona-foto-firma-ssc',
  },
  'youtube-banner-resizer': {
    en: 'youtube-banner-resizer',
    es: 'redimensionar-banner-youtube',
    pt: 'redimensionar-banner-youtube',
    fr: 'redimensionner-banniere-youtube',
    de: 'youtube-banner-verkleinern',
    id: 'ubah-ukuran-banner-youtube',
    tr: 'youtube-banner-boyutlandirma',
    it: 'ridimensiona-banner-youtube',
  },
  'image-to-base64-converter': {
    en: 'image-to-base64-converter',
    es: 'convertir-imagen-a-base64',
    pt: 'converter-imagem-para-base64',
    fr: 'convertir-image-en-base64',
    de: 'bild-in-base64-umwandeln',
    id: 'ubah-gambar-ke-base64',
    tr: 'resmi-base64e-donustur',
    it: 'converti-immagine-in-base64',
  },
  'image-to-data-uri-converter': {
    en: 'image-to-data-uri-converter',
    es: 'convertir-imagen-a-data-uri',
    pt: 'converter-imagem-para-data-uri',
    fr: 'convertir-image-en-data-uri',
    de: 'bild-in-data-uri-umwandeln',
    id: 'ubah-gambar-ke-data-uri',
    tr: 'resmi-data-urie-donustur',
    it: 'converti-immagine-in-data-uri',
  },
  'heic-to-jpg': {
    en: 'heic-to-jpg',
    es: 'convertir-heic-a-jpg',
    pt: 'converter-heic-para-jpg',
    fr: 'convertir-heic-en-jpg',
    de: 'heic-in-jpg-umwandeln',
    id: 'ubah-heic-ke-jpg',
    tr: 'heic-jpg-donusturucu',
    it: 'converti-heic-in-jpg',
  },
  'webp-to-jpg-png-converter': {
    en: 'webp-to-jpg-png-converter',
    es: 'convertir-webp-a-jpg-png',
    pt: 'converter-webp-para-jpg-png',
    fr: 'convertir-webp-en-jpg-png',
    de: 'webp-in-jpg-png-umwandeln',
    id: 'ubah-webp-ke-jpg-png',
    tr: 'webp-jpg-png-donusturucu',
    it: 'converti-webp-in-jpg-png',
  },
};

export interface ToolDefinition {
  id: string;
  icon: string;
  category: string;
  titleKey: string;
  descKey: string;
  keywords: string[];
  badge?: 'POPULAR' | 'NEW';
  isActive: boolean;
}

/**
 * Centralized Single Source of Truth for all tools on ImgFeel.com
 * Any new tool added here is automatically rendered, routed, and searchable.
 */
export const tools: ToolDefinition[] = [
  {
    id: 'image-resizer',
    icon: 'resize',
    category: 'resize',
    titleKey: 'tools.imageResizer.title',
    descKey: 'tools.imageResizer.description',
    keywords: ['resize', 'dimensions', 'percentage', 'target file size', 'kb', 'compress', 'jpg', 'png', 'webp'],
    badge: 'POPULAR',
    isActive: true,
  },
  {
    id: 'webp-to-jpg-png-converter',
    icon: 'image',
    category: 'convert',
    titleKey: 'tools.webpConverter.title',
    descKey: 'tools.webpConverter.description',
    keywords: ['webp', 'jpg', 'png', 'jpeg', 'convert webp to jpg', 'convert webp to png', 'webp converter', 'transparency'],
    badge: 'NEW',
    isActive: true,
  },
  {
    id: 'heic-to-jpg',
    icon: 'image',
    category: 'convert',
    titleKey: 'tools.heicConverter.title',
    descKey: 'tools.heicConverter.description',
    keywords: ['heic', 'heif', 'jpg', 'jpeg', 'iphone', 'apple', 'convert heic to jpg', 'heic converter', 'batch'],
    badge: 'POPULAR',
    isActive: true,
  },
  {
    id: 'cm-mm-resizer',
    icon: 'ruler',
    category: 'resize',
    titleKey: 'tools.cmMmResizer.title',
    descKey: 'tools.cmMmResizer.description',
    keywords: ['cm', 'mm', 'centimeter', 'millimeter', 'dpi', 'ppi', 'print', 'physical size'],
    badge: 'POPULAR',
    isActive: true,
  },
  {
    id: 'pan-card-resizer',
    icon: 'idCard',
    category: 'resize',
    titleKey: 'tools.panCardResizer.title',
    descKey: 'tools.panCardResizer.description',
    keywords: ['pan card', 'pan', 'document', 'kb', 'government', 'portal', 'upload'],
    isActive: true,
  },
  {
    id: 'whatsapp-dp-resizer',
    icon: 'user',
    category: 'resize',
    titleKey: 'tools.whatsappDpResizer.title',
    descKey: 'tools.whatsappDpResizer.description',
    keywords: ['whatsapp', 'dp', 'profile picture', 'circle crop', '1:1', 'square', 'blur'],
    badge: 'POPULAR',
    isActive: true,
  },
  {
    id: 'ssc-photo-signature-resizer',
    icon: 'fileCheck',
    category: 'resize',
    titleKey: 'tools.sscResizer.title',
    descKey: 'tools.sscResizer.description',
    keywords: ['ssc', 'cgl', 'chsl', 'mts', 'gd', 'cpo', 'photo', 'signature', 'passport'],
    badge: 'POPULAR',
    isActive: true,
  },
  {
    id: 'youtube-banner-resizer',
    icon: 'youtube',
    category: 'resize',
    titleKey: 'tools.youtubeBannerResizer.title',
    descKey: 'tools.youtubeBannerResizer.description',
    keywords: ['youtube', 'banner', 'channel art', 'safe area', 'header', '2560x1440', '16:9'],
    isActive: true,
  },
  {
    id: 'image-to-base64-converter',
    icon: 'code',
    category: 'convert',
    titleKey: 'tools.base64Converter.title',
    descKey: 'tools.base64Converter.description',
    keywords: ['base64', 'convert', 'data url', 'encode', 'html img', 'css background', 'text', 'string', 'b64'],
    isActive: true,
  },
  {
    id: 'image-to-data-uri-converter',
    icon: 'link',
    category: 'convert',
    titleKey: 'tools.dataUriConverter.title',
    descKey: 'tools.dataUriConverter.description',
    keywords: ['data uri', 'dataurl', 'base64', 'svg', 'mime', 'convert', 'inline image', 'html img', 'css background'],
    badge: 'NEW',
    isActive: true,
  },
];

export type Tool = (typeof tools)[number];

export function getToolUrl(toolId: string, locale: Locale): string {
  const slugs = TOOL_SLUGS[toolId];
  if (!slugs) {
    if (toolId === 'image-resizer') {
      return locale === 'en' ? '/#resizer' : `/${locale}/#resizer`;
    }
    return locale === 'en' ? '/' : `/${locale}/`;
  }

  const slug = slugs[locale];
  return locale === 'en' ? `/tools/${slug}/` : `/${locale}/tools/${slug}/`;
}

export function getToolIdFromSlug(slug: string): string | null {
  for (const [toolId, slugs] of Object.entries(TOOL_SLUGS)) {
    for (const localeSlug of Object.values(slugs)) {
      if (localeSlug === slug) {
        return toolId;
      }
    }
  }
  return null;
}

export interface SearchableTool {
  id: string;
  title: string;
  description: string;
  href: string;
  keywords: string[];
  icon: string;
  badge?: 'POPULAR' | 'NEW';
}

/**
 * Returns the localized list of searchable tools dynamically built from the single source of truth.
 * Automatically stays up to date whenever new tools are added to `tools`.
 */
export function getSearchableTools(locale: Locale): SearchableTool[] {
  return tools
    .filter((tool) => tool.isActive)
    .map((tool) => {
      const title = t(locale, tool.titleKey);
      const description = t(locale, tool.descKey);
      const href = getToolUrl(tool.id, locale);
      return {
        id: tool.id,
        title,
        description,
        href,
        keywords: tool.keywords,
        icon: tool.icon,
        badge: tool.badge,
      };
    });
}
