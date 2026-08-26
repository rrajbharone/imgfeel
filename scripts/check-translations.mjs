/**
 * Build-time translation parity check for ImgFeel.com
 * 
 * Validates that ALL translation files across ALL locales have:
 * - The same JSON files as the English (master) locale
 * - The exact same keys as the English locale
 * - No empty string values
 * - No untranslated values (identical to English, with allowlist)
 * 
 * Exits with code 1 on ANY failure, preventing the build.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TRANSLATIONS_DIR = resolve(__dirname, '..', 'src', 'i18n', 'translations');

const MASTER_LOCALE = 'en';
const LOCALES = ['en', 'es', 'pt', 'fr', 'de', 'id', 'tr', 'it'];
const NON_MASTER_LOCALES = LOCALES.filter((l) => l !== MASTER_LOCALE);

// Values that are allowed to be identical to English (proper nouns, technical terms)
const ALLOWED_IDENTICAL = new Set([
  'ImgFeel',
  'JPG',
  'JPEG',
  'PNG',
  'WebP',
  'Blog',
  'Canvas',
  '© 2026 ImgFeel. All rights reserved.',
  // International cognates — these words are legitimately the same in many languages
  'Menu',
  'Contact',
  'Format',
  'Dimensions',
  'Dimensions (px)',
  'Portrait',
  'Home',
  'DPI',
  'PPI',
  'CM',
  'MM',
  'cm',
  'mm',
  'in',
  'Acceptable (150+ DPI)',
  'A4',
  'A3',
  'A5',
  'A6',
  '72 DPI (Web)',
  '96 DPI',
  '600 DPI (Fine Art)',
  'A3 Poster',
  'PAN',
  'WhatsApp',
  'DP',
  'WhatsApp DP Resizer',
  'YouTube',
  'YouTube Banner Resizer',
  'Base64',
  'Image to Base64 Converter',
  'Data URI',
  'Image to Data URI Converter',
  'Data URL',
  'Data URL (data:image/...;base64,...)',
  'Base64 Data URI (data:image/...;base64,...)',
  'data:[<mediatype>][;base64],<data>',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  'data:image/svg+xml;utf8,<svg...',
  'HTML <img>',
  'CSS background-image',
  '1000 × 1000 px (HD)',
  '1920 × 1080 px',
  '1024 × 1024 px',
  '512 × 512 px',
  '256 × 256 px',
  '128 × 128 px',
  '64 × 64 px',
  '48 × 48 px',
  '32 × 32 px',
  '24 × 24 px',
  '16 × 16 px',
  '500 × 500 px (Standard)',
  '3.5 × 4.5 cm (200 × 230 px) • 20 KB – 50 KB • JPG',
  '3.5 × 4.5 cm (138 × 177 px) • 20 KB – 50 KB • JPG',
  '4.0 × 2.0 cm (140 × 60 px) • 10 KB – 20 KB • JPG',
  '6.0 × 2.0 cm (240 × 80 px) • 10 KB – 20 KB • JPG',
  'SSC',
  'CGL',
  'CHSL',
  'MTS',
  'GD',
  'CPO',
  'Original',
  'Google',
  'Pixels (px)',
  'Transparent',
  '1920 × 1080 (Full HD 16:9)',
  '1280 × 720 (HD 16:9)',
  '800 × 600 (Standard 4:3)',
  '1200 × 630 (Social / OG)',
  '400 × 400 (Thumbnail)',
  'WebP',
  'WebP Image Compressor',
  'Dimensions',
  'Quality',
  'Custom',
  'Target KB',
  'Balanced (80%)',
  'High Quality (90%)',
  'Max Compression (65%)',
  'Image Dimensions Checker',
  'EXIF',
  'ISO',
  'MIME',
  'SVG',
  'GIF',
  'AVIF',
  'BMP',
  'ICO',
  'TIFF',
  '16:9',
  '4:3',
  '1:1',
  '9:16',
  '3:2',
  '21:9',
  '4:5',
  '2:3',
  '3:1',
  '1.91:1',
  '2.63:1',
  '5.91:1',
  'Full HD',
  '4K Ultra HD',
  '8K Ultra HD',
  '1080p',
  '720p',
  '1440p',
  '2160p',
  '4320p',
  'Image File Size Checker',
  'Bytes',
  'KiB',
  'MiB',
  'BPP',
  'Image Resolution Checker',
  'PPI',
  'DPI',
  'Image Aspect Ratio Checker',
  'Instagram',
  'TikTok',
  'YouTube',
  'YouTube Shorts',
  'Facebook',
  'Twitter / X',
  'LinkedIn',
  '2:1 Univisium',
  'Platform',
  'Orientation',
  'Video Trimmer',
  'MP4',
  'WebM',
  'MOV',
  'M4V',
  'MKV',
  'AVI',
  'H.264',
  'VP9',
  'AV1',
  'Shorts / Reels (60s)',
  'TikTok (15s)',
  'WhatsApp Status (30s)',
  'Video Rotator',
  'Rotate 180°',
  '90°',
  '180°',
  '270°',
  'Image DPI Checker',
  '72 DPI (Web)',
  '300 DPI',
  'English (eng)',
  'HTML5 <picture> (AVIF + WebP + Fallback)',
  'Mobile-First (360, 640, 768, 1080)',
  'Standard Web (480, 768, 1024, 1440)',
  'loading="lazy"',
  'decoding="async"',
  'photo-{00n}',
  '{n} Images',
  'Action',
  'Pause',
  '{n} Photos',
  'No',
  'JPG / JPEG (Standard)',
  'Turkish (Türkçe)',
  'Italian (Italiano)',
  'Indonesian (Bahasa Indonesia)',
  'Portuguese (Português)',
  'German (Deutsch)',
  'French (Français)',
  'Spanish (Español)',
  '72 DPI',
  '150 DPI',
  '200 DPI',
  '600 DPI',
  'EXIF APP1',
  'JFIF APP0',
  'PNG pHYs',
  'BMP Header',
]);

let errors = [];

function loadJson(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    errors.push(`  ✗ Failed to parse JSON: ${filePath} — ${e.message}`);
    return null;
  }
}

function getAllKeys(obj) {
  return Object.keys(obj).sort();
}

// Step 1: Get master (English) files and keys
const masterDir = join(TRANSLATIONS_DIR, MASTER_LOCALE);
if (!existsSync(masterDir)) {
  console.error(`\n✗ Master locale directory not found: ${masterDir}`);
  process.exit(1);
}

const masterFiles = readdirSync(masterDir).filter((f) => f.endsWith('.json'));
if (masterFiles.length === 0) {
  console.error(`\n✗ No JSON files found in master locale: ${masterDir}`);
  process.exit(1);
}

console.log(`\n🔍 Checking translation parity across ${LOCALES.length} locales...`);
console.log(`   Master locale: ${MASTER_LOCALE}`);
console.log(`   Files: ${masterFiles.join(', ')}`);

// Load master translations
const masterData = {};
let totalMasterKeys = 0;
for (const file of masterFiles) {
  const data = loadJson(join(masterDir, file));
  if (data) {
    masterData[file] = data;
    totalMasterKeys += Object.keys(data).length;
  }
}

console.log(`   Total keys: ${totalMasterKeys}\n`);

// Step 2: Check each non-master locale
for (const locale of NON_MASTER_LOCALES) {
  const localeDir = join(TRANSLATIONS_DIR, locale);

  if (!existsSync(localeDir)) {
    errors.push(`[${locale}] ✗ Locale directory missing: ${localeDir}`);
    continue;
  }

  for (const file of masterFiles) {
    const filePath = join(localeDir, file);

    // Check file exists
    if (!existsSync(filePath)) {
      errors.push(`[${locale}] ✗ Missing file: ${file}`);
      continue;
    }

    const localeData = loadJson(filePath);
    if (!localeData) continue;

    const masterKeys = getAllKeys(masterData[file]);
    const localeKeys = getAllKeys(localeData);

    // Check for missing keys
    for (const key of masterKeys) {
      if (!(key in localeData)) {
        errors.push(`[${locale}/${file}] ✗ Missing key: "${key}"`);
      }
    }

    // Check for extra keys (not in master)
    for (const key of localeKeys) {
      if (!(key in masterData[file])) {
        errors.push(`[${locale}/${file}] ✗ Extra key not in master: "${key}"`);
      }
    }

    // Check for empty values
    for (const key of masterKeys) {
      if (key in localeData) {
        const value = localeData[key];
        if (value === '' || value === null || value === undefined) {
          errors.push(`[${locale}/${file}] ✗ Empty value for key: "${key}"`);
        }
      }
    }

    // Check for untranslated values (identical to English)
    for (const key of masterKeys) {
      if (key in localeData && key in masterData[file]) {
        const masterValue = masterData[file][key];
        const localeValue = localeData[key];
        if (
          localeValue === masterValue &&
          !ALLOWED_IDENTICAL.has(masterValue)
        ) {
          errors.push(
            `[${locale}/${file}] ✗ Untranslated (identical to English) key: "${key}" = "${localeValue}"`
          );
        }
      }
    }
  }

  // Check for extra files in locale not in master
  if (existsSync(localeDir)) {
    const localeFiles = readdirSync(localeDir).filter((f) => f.endsWith('.json'));
    for (const file of localeFiles) {
      if (!masterFiles.includes(file)) {
        errors.push(`[${locale}] ✗ Extra file not in master: ${file}`);
      }
    }
  }
}

// Step 3: Report results
if (errors.length > 0) {
  console.error(`\n❌ Translation parity check FAILED with ${errors.length} error(s):\n`);
  for (const error of errors) {
    console.error(`   ${error}`);
  }
  console.error(
    `\n   Fix all errors above before building. Mixed-language pages are not acceptable.\n`
  );
  process.exit(1);
} else {
  console.log(`✅ All translations verified across ${LOCALES.length} locales (${totalMasterKeys} keys each).\n`);
  process.exit(0);
}
