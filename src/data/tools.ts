import type { Locale } from '@/i18n/config';
import { t } from '@/i18n/utils';

export const TOOL_SLUGS: Record<string, Record<Locale, string>> = {
  'exact-dimension-resizer': {
    en: 'resize-image-to-exact-dimensions',
    es: 'redimensionar-imagen-a-dimensiones-exactas',
    pt: 'redimensionar-imagem-para-dimensoes-exatas',
    fr: 'redimensionner-image-aux-dimensions-exactes',
    de: 'bild-auf-exakte-abmessungen-skalieren',
    id: 'ubah-ukuran-gambar-ke-dimensi-pasti',
    tr: 'resmi-tam-boyutlara-gore-yeniden-boyutlandir',
    it: 'ridimensiona-immagine-a-dimensioni-esatte',
  },
  'webp-compressor': {
    en: 'webp-image-compressor',
    es: 'compresor-de-imagenes-webp',
    pt: 'compressor-de-imagens-webp',
    fr: 'compresseur-d-images-webp',
    de: 'webp-bilder-komprimieren',
    id: 'kompres-gambar-webp',
    tr: 'webp-resim-sikistirma',
    it: 'comprimi-immagini-webp',
  },
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
  'image-dimensions-checker': {
    en: 'image-dimensions-checker',
    es: 'verificador-de-dimensiones-de-imagen',
    pt: 'verificador-de-dimensoes-de-imagem',
    fr: 'verificateur-de-dimensions-d-image',
    de: 'bildabmessungen-pruefen',
    id: 'pemeriksa-dimensi-gambar',
    tr: 'resim-boyutlari-kontrol-etme',
    it: 'controllo-dimensioni-immagine',
  },
  'image-file-size-checker': {
    en: 'image-file-size-checker',
    es: 'verificador-de-tamano-de-archivo-de-imagen',
    pt: 'verificador-de-tamanho-de-arquivo-de-imagem',
    fr: 'verificateur-de-taille-de-fichier-image',
    de: 'bilddateigroesse-pruefen',
    id: 'pemeriksa-ukuran-file-gambar',
    tr: 'resim-dosya-boyutu-kontrol-etme',
    it: 'controllo-dimensione-file-immagine',
  },
  'image-resolution-checker': {
    en: 'image-resolution-checker',
    es: 'verificador-de-resolucion-de-imagen',
    pt: 'verificador-de-resolucao-de-imagem',
    fr: 'verificateur-de-resolution-d-image',
    de: 'bildaufloesung-pruefen',
    id: 'pemeriksa-resolusi-gambar',
    tr: 'resim-cozunurluk-kontrol-etme',
    it: 'controllo-risoluzione-immagine',
  },
  'image-aspect-ratio-checker': {
    en: 'image-aspect-ratio-checker',
    es: 'verificador-de-relacion-de-aspecto-de-imagen',
    pt: 'verificador-de-proporcao-de-aspecto-de-imagem',
    fr: 'verificateur-de-ratio-d-aspect-d-image',
    de: 'bild-seitenverhaeltnis-pruefen',
    id: 'pemeriksa-rasio-aspek-gambar',
    tr: 'resim-en-boy-orani-kontrol-etme',
    it: 'controllo-rapporto-d-aspetto-immagine',
  },
  'video-trimmer': {
    en: 'video-trimmer',
    es: 'recortar-video',
    pt: 'cortar-video',
    fr: 'couper-video',
    de: 'video-schneiden',
    id: 'potong-video',
    tr: 'video-kirpma',
    it: 'tagliare-video',
  },
  'video-rotator': {
    en: 'video-rotator',
    es: 'rotar-video',
    pt: 'girar-video',
    fr: 'pivoter-video',
    de: 'video-drehen',
    id: 'putar-video',
    tr: 'video-dondurme',
    it: 'ruotare-video',
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
    id: 'exact-dimension-resizer',
    icon: 'sliders',
    category: 'resize',
    titleKey: 'tools.exactResizer.title',
    descKey: 'tools.exactResizer.description',
    keywords: ['exact dimensions', 'width height', 'pixels', 'px', 'fit', 'crop', 'pad', 'letterbox', 'aspect ratio'],
    badge: 'NEW',
    isActive: true,
  },
  {
    id: 'webp-compressor',
    icon: 'zap',
    category: 'compress',
    titleKey: 'tools.webpCompressor.title',
    descKey: 'tools.webpCompressor.description',
    keywords: ['webp compressor', 'compress webp', 'reduce webp', 'webp optimizer', 'target kb', 'quality', 'shrink webp'],
    badge: 'NEW',
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
  {
    id: 'image-dimensions-checker',
    icon: 'dimensions',
    category: 'inspect',
    titleKey: 'tools.dimensionsChecker.title',
    descKey: 'tools.dimensionsChecker.description',
    keywords: ['dimensions checker', 'image dimensions', 'image info', 'resolution', 'aspect ratio', 'image inspect', 'image metadata', 'image size', 'width height checker', 'dpi finder', 'megapixels', 'exif viewer'],
    badge: 'NEW',
    isActive: true,
  },
  {
    id: 'image-file-size-checker',
    icon: 'filesize',
    category: 'inspect',
    titleKey: 'tools.fileSizeChecker.title',
    descKey: 'tools.fileSizeChecker.description',
    keywords: ['file size checker', 'image file size', 'check image size', 'image size in kb', 'image size in mb', 'image size in bytes', 'file size finder', 'image weight', 'bpp', 'compression efficiency'],
    badge: 'NEW',
    isActive: true,
  },
  {
    id: 'image-resolution-checker',
    icon: 'resolution',
    category: 'inspect',
    titleKey: 'tools.resolutionChecker.title',
    descKey: 'tools.resolutionChecker.description',
    keywords: ['resolution checker', 'image resolution', 'check resolution', 'megapixels', '4k resolution', '1080p resolution', 'dpi checker', 'ppi finder', 'print resolution', 'screen resolution', 'pixel density'],
    badge: 'NEW',
    isActive: true,
  },
  {
    id: 'image-aspect-ratio-checker',
    icon: 'aspectRatio',
    category: 'inspect',
    titleKey: 'tools.aspectRatioChecker.title',
    descKey: 'tools.aspectRatioChecker.description',
    keywords: ['aspect ratio checker', 'image aspect ratio', 'calculate aspect ratio', '16:9 ratio', '4:3 ratio', '1:1 ratio', '9:16 story ratio', 'social media aspect ratio', 'proportions checker', 'image ratio finder', 'css aspect ratio'],
    badge: 'NEW',
    isActive: true,
  },
  {
    id: 'video-trimmer',
    icon: 'scissors',
    category: 'video',
    titleKey: 'tools.videoTrimmer.title',
    descKey: 'tools.videoTrimmer.description',
    keywords: ['video trimmer', 'trim video', 'cut video', 'video cutter', 'mp4 trimmer', 'clip video', 'trim video online', 'video editor', 'shorten video', 'crop video length', 'tiktok trimmer', 'reels cutter'],
    badge: 'NEW',
    isActive: true,
  },
  {
    id: 'video-rotator',
    icon: 'rotate',
    category: 'video',
    titleKey: 'tools.videoRotator.title',
    descKey: 'tools.videoRotator.description',
    keywords: ['video rotator', 'rotate video', 'rotate mp4', 'turn video', 'rotate 90 degrees', 'rotate 180 degrees', 'flip video', 'mirror video', 'portrait to landscape video', 'fix sideways video', 'rotate video online'],
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
