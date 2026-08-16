/**
 * Client-Side Image Aspect Ratio Analyzer Engine for ImgFeel.com
 * 100% Client-Side Privacy: All parsing and dimension calculations execute in the browser.
 */

export interface PlatformFit {
  id: string;
  nameKey: string;
  formatKey: string;
  targetRatioStr: string;
  targetRatioDec: number;
  status: 'perfect' | 'near' | 'crop' | 'letterbox';
  statusKey: string;
  diffPercent: number;
}

export interface AspectRatioAnalysis {
  width: number;
  height: number;
  megapixels: string;
  totalPixels: number;
  aspectRatio: string;
  aspectRatioDecimal: string;
  aspectRatioDecimalFull: number;
  paddingTopPercent: string;
  orientation: 'landscape' | 'portrait' | 'square';
  orientationKey: string;
  standardMatch: string;
  standardMatchKey: string;
  standardCategory: string;
  standardCategoryKey: string;
  fileName: string;
  fileSizeFormatted: string;
  fileSizeBytes: number;
  detectedFormat: string;
  colorDepth: string;
  previewUrl: string;
  cssModern: string;
  cssDecimal: string;
  cssPaddingHack: string;
  htmlSnippet: string;
  platformFits: PlatformFit[];
}

/**
 * Standard aspect ratios table with tolerance matching
 */
interface StandardRatioDef {
  w: number;
  h: number;
  label: string;
  labelKey: string;
  category: string;
  categoryKey: string;
  ratio: number;
}

const STANDARD_RATIOS: StandardRatioDef[] = [
  { w: 16, h: 9, label: '16:9 Widescreen', labelKey: 'ratio.std.16_9', category: 'HD / 4K Video & Displays', categoryKey: 'ratio.cat.video', ratio: 16 / 9 },
  { w: 9, h: 16, label: '9:16 Vertical Story / Reel', labelKey: 'ratio.std.9_16', category: 'Shorts, TikTok, Stories', categoryKey: 'ratio.cat.social_vert', ratio: 9 / 16 },
  { w: 4, h: 3, label: '4:3 Standard Television', labelKey: 'ratio.std.4_3', category: 'Classic Monitors & Cameras', categoryKey: 'ratio.cat.classic', ratio: 4 / 3 },
  { w: 3, h: 4, label: '3:4 Portrait', labelKey: 'ratio.std.3_4', category: 'Tablet & Document View', categoryKey: 'ratio.cat.tablet', ratio: 3 / 4 },
  { w: 1, h: 1, label: '1:1 Square', labelKey: 'ratio.std.1_1', category: 'Instagram & Profile Pictures', categoryKey: 'ratio.cat.square', ratio: 1 / 1 },
  { w: 3, h: 2, label: '3:2 Classic 35mm DSLR', labelKey: 'ratio.std.3_2', category: 'Photography Standard', categoryKey: 'ratio.cat.photo', ratio: 3 / 2 },
  { w: 2, h: 3, label: '2:3 Portrait Photo', labelKey: 'ratio.std.2_3', category: 'Portrait Photography', categoryKey: 'ratio.cat.photo_port', ratio: 2 / 3 },
  { w: 4, h: 5, label: '4:5 Social Portrait', labelKey: 'ratio.std.4_5', category: 'Instagram Feed Portrait', categoryKey: 'ratio.cat.insta_port', ratio: 4 / 5 },
  { w: 5, h: 4, label: '5:4 Standard Landscape', labelKey: 'ratio.std.5_4', category: 'Medium Format Photo & Print', categoryKey: 'ratio.cat.print', ratio: 5 / 4 },
  { w: 21, h: 9, label: '21:9 Ultrawide Cinema', labelKey: 'ratio.std.21_9', category: 'Cinematic Ultrawide', categoryKey: 'ratio.cat.cinema', ratio: 21 / 9 },
  { w: 32, h: 9, label: '32:9 Super Ultrawide', labelKey: 'ratio.std.32_9', category: 'Curved Gaming Monitors', categoryKey: 'ratio.cat.gaming', ratio: 32 / 9 },
  { w: 191, h: 100, label: '1.91:1 Landscape Post', labelKey: 'ratio.std.191_100', category: 'Facebook & Twitter Link Cards', categoryKey: 'ratio.cat.social_land', ratio: 1.91 },
  { w: 3, h: 1, label: '3:1 Panoramic Banner', labelKey: 'ratio.std.3_1', category: 'Twitter / X Headers', categoryKey: 'ratio.cat.banner', ratio: 3 / 1 },
  { w: 2, h: 1, label: '2:1 Univisium', labelKey: 'ratio.std.2_1', category: 'Modern Streaming Video', categoryKey: 'ratio.cat.streaming', ratio: 2 / 1 },
];

/**
 * Platform targets for social compatibility checks
 */
interface PlatformDef {
  id: string;
  nameKey: string;
  formatKey: string;
  targetW: number;
  targetH: number;
}

const PLATFORM_TARGETS: PlatformDef[] = [
  { id: 'insta-square', nameKey: 'ratio.platform.insta', formatKey: 'ratio.platform.instaSquare', targetW: 1, targetH: 1 },
  { id: 'insta-portrait', nameKey: 'ratio.platform.insta', formatKey: 'ratio.platform.instaPortrait', targetW: 4, targetH: 5 },
  { id: 'insta-story', nameKey: 'ratio.platform.insta', formatKey: 'ratio.platform.instaStory', targetW: 9, targetH: 16 },
  { id: 'yt-video', nameKey: 'ratio.platform.yt', formatKey: 'ratio.platform.ytVideo', targetW: 16, targetH: 9 },
  { id: 'yt-shorts', nameKey: 'ratio.platform.yt', formatKey: 'ratio.platform.ytShorts', targetW: 9, targetH: 16 },
  { id: 'tiktok', nameKey: 'ratio.platform.tiktok', formatKey: 'ratio.platform.tiktokVideo', targetW: 9, targetH: 16 },
  { id: 'fb-post', nameKey: 'ratio.platform.fb', formatKey: 'ratio.platform.fbPost', targetW: 191, targetH: 100 },
  { id: 'twitter-card', nameKey: 'ratio.platform.twitter', formatKey: 'ratio.platform.twitterCard', targetW: 16, targetH: 9 },
  { id: 'linkedin-post', nameKey: 'ratio.platform.linkedin', formatKey: 'ratio.platform.linkedinPost', targetW: 191, targetH: 100 },
];

/**
 * Calculates greatest common divisor via Euclidean algorithm
 */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Simplifies a fraction to standard aspect ratio or closest known standard
 */
function calculateAspectRatio(w: number, h: number): {
  fractionStr: string;
  decimalStr: string;
  decimalFull: number;
  paddingTop: string;
  matchName: string;
  matchNameKey: string;
  category: string;
  categoryKey: string;
} {
  if (w <= 0 || h <= 0) {
    return {
      fractionStr: '1:1',
      decimalStr: '1.00',
      decimalFull: 1.0,
      paddingTop: '100%',
      matchName: 'Square',
      matchNameKey: 'ratio.std.1_1',
      category: 'Square',
      categoryKey: 'ratio.cat.square',
    };
  }

  const actualRatio = w / h;
  const decimalFull = actualRatio;
  const decimalStr = actualRatio.toFixed(2);
  const paddingTop = `${((h / w) * 100).toFixed(2)}%`;

  // Check if it matches a known standard within a close tolerance (e.g. 0.8% threshold)
  let bestMatch: StandardRatioDef | null = null;
  let minDiff = Infinity;

  for (const std of STANDARD_RATIOS) {
    const diff = Math.abs(actualRatio - std.ratio);
    if (diff < minDiff) {
      minDiff = diff;
      if (diff / std.ratio < 0.012) {
        bestMatch = std;
      }
    }
  }

  if (bestMatch) {
    return {
      fractionStr: `${bestMatch.w}:${bestMatch.h}`,
      decimalStr,
      decimalFull,
      paddingTop,
      matchName: bestMatch.label,
      matchNameKey: bestMatch.labelKey,
      category: bestMatch.category,
      categoryKey: bestMatch.categoryKey,
    };
  }

  // Otherwise calculate exact mathematical reduced fraction
  const divisor = gcd(w, h);
  let simpW = Math.round(w / divisor);
  let simpH = Math.round(h / divisor);

  // If numbers are too large or awkward, use decimal approximation (e.g. 1.78:1)
  let fractionStr = `${simpW}:${simpH}`;
  if (simpW > 50 || simpH > 50) {
    fractionStr = `${actualRatio.toFixed(3)}:1`;
  }

  return {
    fractionStr,
    decimalStr,
    decimalFull,
    paddingTop,
    matchName: `${fractionStr} Custom`,
    matchNameKey: 'ratio.std.custom',
    category: actualRatio > 1 ? 'Landscape Graphic' : actualRatio < 1 ? 'Portrait Graphic' : 'Square Graphic',
    categoryKey: actualRatio > 1 ? 'ratio.cat.custom_land' : actualRatio < 1 ? 'ratio.cat.custom_port' : 'ratio.cat.custom_sq',
  };
}

/**
 * Evaluates social media platform compatibility
 */
function evaluatePlatformFits(w: number, h: number): PlatformFit[] {
  const currentRatio = w / h;

  return PLATFORM_TARGETS.map((target) => {
    const targetRatio = target.targetW / target.targetH;
    const diff = Math.abs(currentRatio - targetRatio) / targetRatio;

    let status: PlatformFit['status'] = 'crop';
    let statusKey = 'ratio.status.crop';

    if (diff < 0.015) {
      status = 'perfect';
      statusKey = 'ratio.status.perfect';
    } else if (diff < 0.06) {
      status = 'near';
      statusKey = 'ratio.status.near';
    } else if (currentRatio > targetRatio) {
      status = 'crop';
      statusKey = 'ratio.status.cropSide';
    } else {
      status = 'letterbox';
      statusKey = 'ratio.status.cropTop';
    }

    const targetRatioStr = target.targetW === 191 && target.targetH === 100
      ? '1.91:1'
      : `${target.targetW}:${target.targetH}`;

    return {
      id: target.id,
      nameKey: target.nameKey,
      formatKey: target.formatKey,
      targetRatioStr,
      targetRatioDec: Number(targetRatio.toFixed(2)),
      status,
      statusKey,
      diffPercent: Math.round(diff * 100),
    };
  });
}

/**
 * Format bytes into human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
}

/**
 * Detect image format from binary magic bytes
 */
export async function detectFormatFromBytes(file: File): Promise<string> {
  try {
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'JPEG / JPG';
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'PNG';
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'WebP';
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'GIF';
    if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70 &&
        bytes[8] === 0x61 && bytes[9] === 0x76 && bytes[10] === 0x69 && bytes[11] === 0x66) return 'AVIF';
    if (bytes[0] === 0x42 && bytes[1] === 0x4d) return 'BMP';
    if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) return 'ICO';
    if ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
        (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a)) return 'TIFF';

    const ext = file.name.split('.').pop()?.toUpperCase() || 'IMAGE';
    return ext === 'SVG' ? 'SVG Vector' : ext;
  } catch {
    return file.type ? file.type.replace('image/', '').toUpperCase() : 'UNKNOWN';
  }
}

/**
 * Main Analysis Function: Ingests an image file and extracts full aspect ratio metrics
 */
export async function analyzeImageAspectRatio(file: File): Promise<AspectRatioAnalysis> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      const previewUrl = reader.result as string;

      img.onerror = () => reject(new Error('Could not decode image'));
      img.onload = async () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        if (!width || !height) {
          reject(new Error('Image has zero dimensions'));
          return;
        }

        const totalPixels = width * height;
        const megapixels = (totalPixels / 1000000).toFixed(2);

        const ratioData = calculateAspectRatio(width, height);

        let orientation: AspectRatioAnalysis['orientation'] = 'landscape';
        let orientationKey = 'ratio.orient.landscape';

        if (width < height) {
          orientation = 'portrait';
          orientationKey = 'ratio.orient.portrait';
        } else if (width === height) {
          orientation = 'square';
          orientationKey = 'ratio.orient.square';
        }

        // Color depth detection via temporary canvas
        let colorDepth = '24-bit TrueColor (RGB)';
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(width, 32);
          canvas.height = Math.min(height, 32);
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let hasAlpha = false;
            for (let i = 3; i < imgData.length; i += 4) {
              if (imgData[i] < 255) {
                hasAlpha = true;
                break;
              }
            }
            if (hasAlpha) {
              colorDepth = '32-bit RGBA (Alpha Transparency)';
            }
          }
        } catch {
          // Canvas inspection fallback
        }

        const detectedFormat = await detectFormatFromBytes(file);
        const platformFits = evaluatePlatformFits(width, height);

        // CSS Snippets
        const cssModern = `aspect-ratio: ${ratioData.fractionStr.replace(':', ' / ')};`;
        const cssDecimal = `aspect-ratio: ${ratioData.decimalFull.toFixed(4)};`;
        const cssPaddingHack = `padding-top: ${ratioData.paddingTop}; /* legacy hack */`;
        const htmlSnippet = `<img src="${file.name}" width="${width}" height="${height}" style="aspect-ratio: ${ratioData.fractionStr.replace(':', '/')}; width: 100%; height: auto;" alt="Responsive image" />`;

        resolve({
          width,
          height,
          megapixels,
          totalPixels,
          aspectRatio: ratioData.fractionStr,
          aspectRatioDecimal: ratioData.decimalStr,
          aspectRatioDecimalFull: ratioData.decimalFull,
          paddingTopPercent: ratioData.paddingTop,
          orientation,
          orientationKey,
          standardMatch: ratioData.matchName,
          standardMatchKey: ratioData.matchNameKey,
          standardCategory: ratioData.category,
          standardCategoryKey: ratioData.categoryKey,
          fileName: file.name,
          fileSizeFormatted: formatBytes(file.size),
          fileSizeBytes: file.size,
          detectedFormat,
          colorDepth,
          previewUrl,
          cssModern,
          cssDecimal,
          cssPaddingHack,
          htmlSnippet,
          platformFits,
        });
      };

      img.src = previewUrl;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Calculates target dimension while locking aspect ratio
 */
export function calculateScaledDimension(
  origW: number,
  origH: number,
  newW?: number,
  newH?: number
): { width: number; height: number } {
  if (!origW || !origH) return { width: 0, height: 0 };
  const ratio = origW / origH;

  if (newW && newW > 0) {
    const calcH = Math.round(newW / ratio);
    return { width: Math.round(newW), height: calcH };
  }

  if (newH && newH > 0) {
    const calcW = Math.round(newH * ratio);
    return { width: calcW, height: Math.round(newH) };
  }

  return { width: origW, height: origH };
}

/**
 * Generates a clean 16:9 1080p sample image in the browser for instant testing
 */
export async function generateSampleImage(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Rich Modern Gradient Background
    const grad = ctx.createLinearGradient(0, 0, 1920, 1080);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#312e81');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1920, 1080);

    // Decorative Graphic Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    for (let x = 120; x < 1920; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1080);
      ctx.stroke();
    }
    for (let y = 120; y < 1080; y += 120) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1920, y);
      ctx.stroke();
    }

    // Centered Aspect Ratio Framing Badge
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 6;
    ctx.strokeRect(240, 135, 1440, 810);

    // Typography
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 84px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('16:9 Widescreen Sample', 960, 500);

    ctx.fillStyle = '#a5b4fc';
    ctx.font = '600 42px system-ui, -apple-system, sans-serif';
    ctx.fillText('1920 × 1080 px • 2.07 Megapixels • Full HD', 960, 580);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 28px system-ui, -apple-system, sans-serif';
    ctx.fillText('ImgFeel.com Image Aspect Ratio Checker Demo', 960, 650);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const sampleFile = new File([blob || new Blob()], '16-9-sample-widescreen.jpg', {
        type: 'image/jpeg',
      });
      resolve(sampleFile);
    }, 'image/jpeg', 0.92);
  });
}
