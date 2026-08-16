/**
 * Resolution Checker Client-Side Engine
 * 100% Client-Side Image Resolution, Megapixel, Aspect Ratio, DPI Print & Display Clarity Analyzer
 */

export interface PrintSizeMetric {
  dpi: number;
  label: string;
  widthIn: number;
  heightIn: number;
  widthCm: number;
  heightCm: number;
  widthMm: number;
  heightMm: number;
  qualityBadge: string;
}

export interface ResolutionStandard {
  name: string;
  category: string;
  width: number;
  height: number;
  description: string;
}

export interface ResolutionAnalysis {
  file: File | null;
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  mimeType: string;
  detectedFormat: string;
  width: number;
  height: number;
  totalPixels: number;
  megapixels: number;
  aspectRatio: string;
  aspectRatioDecimal: number;
  orientation: 'Landscape' | 'Portrait' | 'Square';
  standardMatch: string;
  standardCategory: string;
  embeddedDpi: number | null;
  hasAlpha: boolean;
  colorDepth: string;
  screenClarity: {
    mobilePhone: string;
    desktopMonitor: string;
    tvScreen: string;
  };
  printSizes: PrintSizeMetric[];
  previewUrl: string;
}

const COMMON_STANDARDS: ResolutionStandard[] = [
  { name: '8K Ultra HD (4320p)', category: 'Video & Display', width: 7680, height: 4320, description: 'Highest broadcast standard' },
  { name: '4K Ultra HD (2160p)', category: 'Video & Display', width: 3840, height: 2160, description: 'Standard 4K UHD standard' },
  { name: 'Cinema 4K (DCI)', category: 'Cinema Standard', width: 4096, height: 2160, description: 'DCI theatrical 4K' },
  { name: 'QHD 2K (1440p)', category: 'Gaming & Monitor', width: 2560, height: 1440, description: 'Quad HD 2.5K standard' },
  { name: 'Full HD (1080p)', category: 'Universal Display', width: 1920, height: 1080, description: 'Standard high definition' },
  { name: 'HD Ready (720p)', category: 'Universal Display', width: 1280, height: 720, description: 'Standard web HD' },
  { name: 'SD Standard (480p)', category: 'Standard Definition', width: 854, height: 480, description: 'NTSC DVD standard' },
  { name: 'Instagram Square (1:1)', category: 'Social Media', width: 1080, height: 1080, description: 'Square feed post' },
  { name: 'Instagram Portrait (4:5)', category: 'Social Media', width: 1080, height: 1350, description: 'Vertical feed post' },
  { name: 'Instagram / TikTok Story (9:16)', category: 'Social Media', width: 1080, height: 1920, description: 'Full screen vertical reel' },
  { name: 'YouTube Banner', category: 'Social Media', width: 2560, height: 1440, description: 'Channel art master' },
  { name: 'YouTube Thumbnail', category: 'Social Media', width: 1280, height: 720, description: 'Video preview card' },
  { name: 'Twitter/X Header', category: 'Social Media', width: 1500, height: 500, description: 'Profile header cover' },
  { name: 'Facebook Cover', category: 'Social Media', width: 820, height: 312, description: 'Profile page banner' },
  { name: 'LinkedIn Banner', category: 'Social Media', width: 1584, height: 396, description: 'Personal profile cover' },
  { name: 'A4 Document (300 DPI)', category: 'Print Standard', width: 2480, height: 3508, description: 'Standard international paper' },
  { name: 'US Letter (300 DPI)', category: 'Print Standard', width: 2550, height: 3300, description: 'North American paper' },
  { name: '4×6 Photo (300 DPI)', category: 'Print Standard', width: 1200, height: 1800, description: 'Classic postcard photo' },
];

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function calculateAspectRatio(w: number, h: number): { ratio: string; decimal: number } {
  if (w <= 0 || h <= 0) return { ratio: '1:1', decimal: 1 };
  const divisor = gcd(w, h);
  let simplifiedW = w / divisor;
  let simplifiedH = h / divisor;

  // Approximate common ratios if numbers are large
  const decimal = parseFloat((w / h).toFixed(3));
  if (Math.abs(decimal - 1.778) < 0.03) return { ratio: '16:9', decimal };
  if (Math.abs(decimal - 0.562) < 0.03) return { ratio: '9:16', decimal };
  if (Math.abs(decimal - 1.333) < 0.03) return { ratio: '4:3', decimal };
  if (Math.abs(decimal - 0.75) < 0.03) return { ratio: '3:4', decimal };
  if (Math.abs(decimal - 1.5) < 0.03) return { ratio: '3:2', decimal };
  if (Math.abs(decimal - 0.667) < 0.03) return { ratio: '2:3', decimal };
  if (Math.abs(decimal - 1.0) < 0.01) return { ratio: '1:1', decimal };
  if (Math.abs(decimal - 0.8) < 0.02) return { ratio: '4:5', decimal };
  if (Math.abs(decimal - 2.333) < 0.05) return { ratio: '21:9', decimal };

  if (simplifiedW > 50 || simplifiedH > 50) {
    return { ratio: `${(w / h).toFixed(2)}:1`, decimal };
  }
  return { ratio: `${simplifiedW}:${simplifiedH}`, decimal };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  if (bytes < 1024) return `${bytes} Bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function matchStandard(w: number, h: number): { name: string; category: string } {
  // Check exact matches or orientation flips
  for (const std of COMMON_STANDARDS) {
    if ((std.width === w && std.height === h) || (std.width === h && std.height === w)) {
      return { name: std.name, category: std.category };
    }
  }

  // Classify by megapixels and resolution tier
  const maxDim = Math.max(w, h);
  const minDim = Math.min(w, h);

  if (maxDim >= 7680 || minDim >= 4320) return { name: '8K Ultra HD Class', category: 'Ultra High Res' };
  if (maxDim >= 3840 || minDim >= 2160) return { name: '4K Ultra HD Class', category: 'Ultra High Res' };
  if (maxDim >= 2560 || minDim >= 1440) return { name: 'QHD 2.5K Class', category: 'High Resolution' };
  if (maxDim >= 1920 || minDim >= 1080) return { name: 'Full HD 1080p Class', category: 'High Definition' };
  if (maxDim >= 1280 || minDim >= 720) return { name: 'HD 720p Class', category: 'Standard HD' };
  if (maxDim >= 854 || minDim >= 480) return { name: 'SD 480p Class', category: 'Standard Definition' };
  return { name: 'Compact Custom Resolution', category: 'Web Graphic' };
}

function calculatePrintSizes(w: number, h: number): PrintSizeMetric[] {
  const DPI_SETTINGS = [
    { dpi: 300, label: '300 DPI — Photo / Gallery Quality', badge: 'Maximum Sharpness' },
    { dpi: 200, label: '200 DPI — Magazine / Book Quality', badge: 'High Quality' },
    { dpi: 150, label: '150 DPI — Poster / Flyer Quality', badge: 'Good for Distance' },
    { dpi: 72, label: '72 DPI — Screen / Billboard Draft', badge: 'Draft Only' },
  ];

  return DPI_SETTINGS.map(({ dpi, label, badge }) => {
    const widthIn = parseFloat((w / dpi).toFixed(2));
    const heightIn = parseFloat((h / dpi).toFixed(2));
    const widthCm = parseFloat((widthIn * 2.54).toFixed(1));
    const heightCm = parseFloat((heightIn * 2.54).toFixed(1));
    const widthMm = Math.round(widthCm * 10);
    const heightMm = Math.round(heightCm * 10);

    return {
      dpi,
      label,
      widthIn,
      heightIn,
      widthCm,
      heightCm,
      widthMm,
      heightMm,
      qualityBadge: badge,
    };
  });
}

function evaluateScreenClarity(w: number, h: number): { mobilePhone: string; desktopMonitor: string; tvScreen: string } {
  const maxDim = Math.max(w, h);

  let mobilePhone = '⭐⭐ Standard Clarity (1× Web)';
  if (maxDim >= 2400) mobilePhone = '⭐⭐⭐⭐⭐ Super Retina / Ultra-Sharp (3× Retina)';
  else if (maxDim >= 1600) mobilePhone = '⭐⭐⭐⭐ Retina Sharp (2× Display)';
  else if (maxDim >= 800) mobilePhone = '⭐⭐⭐ Sharp on Standard Mobile Screens';

  let desktopMonitor = '⭐⭐ Low / Scaled Resolution';
  if (maxDim >= 3840) desktopMonitor = '⭐⭐⭐⭐⭐ 4K UHD Monitor Ready';
  else if (maxDim >= 2560) desktopMonitor = '⭐⭐⭐⭐ QHD 1440p Monitor Crisp';
  else if (maxDim >= 1920) desktopMonitor = '⭐⭐⭐ 1080p FHD Monitor Native';

  let tvScreen = '⭐⭐ Low on Large Displays';
  if (maxDim >= 7680) tvScreen = '⭐⭐⭐⭐⭐ 8K TV Native Perfection';
  else if (maxDim >= 3840) tvScreen = '⭐⭐⭐⭐ 4K Ultra HD TV Crisp';
  else if (maxDim >= 1920) tvScreen = '⭐⭐⭐ 1080p Smart TV Crisp';

  return { mobilePhone, desktopMonitor, tvScreen };
}

function detectBinaryFormat(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer.slice(0, 16));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'JPEG / JPG';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'PNG';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'WebP';
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'GIF';
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return 'AVIF / HEIC';
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) return 'BMP';
  if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) return 'ICO';
  if ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
      (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a)) return 'TIFF';
  return 'Unknown / Custom';
}

function extractEmbeddedDpi(buffer: ArrayBuffer): number | null {
  const view = new DataView(buffer);
  const len = buffer.byteLength;

  // Check JPEG JFIF
  if (len > 20 && view.getUint8(0) === 0xff && view.getUint8(1) === 0xd8) {
    let offset = 2;
    while (offset < len - 4) {
      const marker = view.getUint16(offset);
      if (marker === 0xffe0) { // APP0 (JFIF)
        const densityUnits = view.getUint8(offset + 11);
        const xDensity = view.getUint16(offset + 12);
        if (densityUnits === 1 && xDensity > 0) return xDensity; // DPI
        if (densityUnits === 2 && xDensity > 0) return Math.round(xDensity * 2.54); // DPC to DPI
        break;
      }
      if ((marker & 0xff00) === 0xff00) {
        const chunkLen = view.getUint16(offset + 2);
        offset += 2 + chunkLen;
      } else {
        break;
      }
    }
  }

  // Check PNG pHYs chunk
  if (len > 30 && view.getUint32(0) === 0x89504e47) {
    let offset = 8;
    while (offset < len - 8) {
      const chunkLen = view.getUint32(offset);
      const chunkType = view.getUint32(offset + 4);
      if (chunkType === 0x70485973) { // 'pHYs'
        const ppuX = view.getUint32(offset + 8);
        const unit = view.getUint8(offset + 16);
        if (unit === 1 && ppuX > 0) { // meters to inches
          return Math.round(ppuX * 0.0254);
        }
        break;
      }
      offset += 12 + chunkLen;
    }
  }

  return null;
}

export async function analyzeImageResolution(file: File): Promise<ResolutionAnalysis> {
  const buffer = await file.arrayBuffer();
  const detectedFormat = detectBinaryFormat(buffer);
  const embeddedDpi = extractEmbeddedDpi(buffer);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file format'));
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const totalPixels = width * height;
        const megapixels = parseFloat((totalPixels / 1000000).toFixed(2));
        const { ratio: aspectRatio, decimal: aspectRatioDecimal } = calculateAspectRatio(width, height);

        let orientation: 'Landscape' | 'Portrait' | 'Square' = 'Landscape';
        if (width === height) orientation = 'Square';
        else if (height > width) orientation = 'Portrait';

        const { name: standardMatch, category: standardCategory } = matchStandard(width, height);
        const printSizes = calculatePrintSizes(width, height);
        const screenClarity = evaluateScreenClarity(width, height);

        // Alpha check via canvas
        let hasAlpha = false;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(width, 100);
          canvas.height = Math.min(height, 100);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            for (let i = 3; i < imgData.length; i += 4) {
              if (imgData[i] < 255) {
                hasAlpha = true;
                break;
              }
            }
          }
        } catch {
          // Ignore cross-origin canvas security errors
        }

        resolve({
          file,
          fileName: file.name,
          fileSizeBytes: file.size,
          fileSizeFormatted: formatBytes(file.size),
          mimeType: file.type || 'image/unknown',
          detectedFormat,
          width,
          height,
          totalPixels,
          megapixels,
          aspectRatio,
          aspectRatioDecimal,
          orientation,
          standardMatch,
          standardCategory,
          embeddedDpi,
          hasAlpha,
          colorDepth: hasAlpha ? '32-bit (RGBA with Alpha)' : '24-bit (TrueColor RGB)',
          screenClarity,
          printSizes,
          previewUrl: dataUrl,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/** Generate a 4K sample image for testing */
export function generateSampleImage(): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 3840;
    canvas.height = 2160;
    const ctx = canvas.getContext('2d')!;

    // Ultra high-res gradient background
    const grad = ctx.createLinearGradient(0, 0, 3840, 2160);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#312e81');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 3840, 2160);

    // Decorative grid rings
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.lineWidth = 4;
    for (let r = 200; r <= 1600; r += 200) {
      ctx.beginPath();
      ctx.arc(1920, 1080, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // High resolution banner text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 120px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('4K Ultra HD • 3840 × 2160', 1920, 1020);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '60px sans-serif';
    ctx.fillText('8.29 Megapixels • 16:9 Aspect Ratio • 300 DPI Master', 1920, 1140);

    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], 'sample-4k-resolution.png', { type: 'image/png' }));
      }
    }, 'image/png');
  });
}
