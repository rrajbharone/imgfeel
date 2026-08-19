/**
 * Image DPI & Metadata Density Parser for ImgFeel.com
 * 100% Client-Side In-Browser Header & EXIF Analysis
 */

export interface DpiMetadata {
  file: File;
  name: string;
  size: number;
  sizeFormatted: string;
  type: string;
  width: number;
  height: number;
  aspectRatio: string;
  megapixels: number;
  hasEmbeddedDpi: boolean;
  sourceTag: string; // 'EXIF', 'JFIF', 'PNG pHYs', 'BMP', 'None (Default 72 DPI)'
  dpiX: number;
  dpiY: number;
  effectiveDpi: number;
  unit: 'inch' | 'cm' | 'default';
  
  // Physical print sizes at current embedded / effective DPI
  printWidthInches: number;
  printHeightInches: number;
  printWidthCm: number;
  printHeightCm: number;
  printWidthMm: number;
  printHeightMm: number;

  // Max print size at 300 DPI (Gold Standard)
  maxPrint300Inches: { width: number; height: number };
  maxPrint300Cm: { width: number; height: number };

  // Max print size at 150 DPI (Posters / Viewing distance)
  maxPrint150Inches: { width: number; height: number };
  maxPrint150Cm: { width: number; height: number };

  url: string;
}

export interface PrintFormatSuitability {
  id: string;
  name: string;
  sizeInches: string;
  sizeCm: string;
  widthInches: number;
  heightInches: number;
  reqWidth300: number;
  reqHeight300: number;
  effectiveDpi: number;
  status: 'excellent' | 'good' | 'acceptable' | 'poor';
}

/**
 * Format bytes to readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function calculateAspectRatio(w: number, h: number): string {
  if (!w || !h) return '16:9';
  const divisor = gcd(w, h);
  let ratio = `${w / divisor}:${h / divisor}`;
  const dec = w / h;

  if (Math.abs(dec - 16 / 9) < 0.03) ratio = '16:9';
  else if (Math.abs(dec - 4 / 3) < 0.03) ratio = '4:3';
  else if (Math.abs(dec - 1 / 1) < 0.02) ratio = '1:1';
  else if (Math.abs(dec - 3 / 2) < 0.03) ratio = '3:2';
  else if (Math.abs(dec - 2 / 3) < 0.03) ratio = '2:3';
  else if (Math.abs(dec - 9 / 16) < 0.03) ratio = '9:16';
  else if (Math.abs(dec - 4 / 5) < 0.03) ratio = '4:5';

  return ratio;
}

/**
 * Binary parser to extract DPI from JPEG, PNG, BMP, TIFF, WebP
 */
export function extractDpiFromBuffer(buffer: ArrayBuffer): {
  hasEmbeddedDpi: boolean;
  dpiX: number;
  dpiY: number;
  sourceTag: string;
  unit: 'inch' | 'cm' | 'default';
} {
  const view = new DataView(buffer);
  const len = buffer.byteLength;

  // 1. Check PNG (Magic bytes 0x89, 0x50, 0x4E, 0x47)
  if (len > 8 && view.getUint8(0) === 0x89 && view.getUint8(1) === 0x50 && view.getUint8(2) === 0x4e && view.getUint8(3) === 0x47) {
    let offset = 8;
    while (offset + 8 < len) {
      const chunkLen = view.getUint32(offset);
      const chunkType = String.fromCharCode(
        view.getUint8(offset + 4),
        view.getUint8(offset + 5),
        view.getUint8(offset + 6),
        view.getUint8(offset + 7)
      );

      if (chunkType === 'pHYs' && offset + 12 + 9 <= len) {
        const ppuX = view.getUint32(offset + 8);
        const ppuY = view.getUint32(offset + 12);
        const unitSpecifier = view.getUint8(offset + 16);

        if (unitSpecifier === 1) {
          // 1 = meters -> convert to inches (1 meter = 39.3701 inches -> * 0.0254)
          const dpiX = Math.round(ppuX * 0.0254);
          const dpiY = Math.round(ppuY * 0.0254);
          if (dpiX > 0 && dpiY > 0) {
            return { hasEmbeddedDpi: true, dpiX, dpiY, sourceTag: 'PNG pHYs', unit: 'inch' };
          }
        } else if (ppuX > 0 && ppuY > 0) {
          return { hasEmbeddedDpi: true, dpiX: ppuX, dpiY: ppuY, sourceTag: 'PNG pHYs (Aspect Only)', unit: 'default' };
        }
      }

      if (chunkType === 'IEND') break;
      offset += 12 + chunkLen;
    }
  }

  // 2. Check JPEG (Magic bytes 0xFF, 0xD8)
  if (len > 4 && view.getUint8(0) === 0xff && view.getUint8(1) === 0xd8) {
    let offset = 2;
    let jfifDpi: { dpiX: number; dpiY: number; unit: 'inch' | 'cm'; sourceTag: string } | null = null;
    let exifDpi: { dpiX: number; dpiY: number; unit: 'inch' | 'cm'; sourceTag: string } | null = null;

    while (offset + 4 < len) {
      if (view.getUint8(offset) !== 0xff) {
        offset++;
        continue;
      }
      const marker = view.getUint8(offset + 1);
      if (marker === 0xda || marker === 0xd9) break; // SOS or EOI

      const segmentLen = view.getUint16(offset + 2);

      // APP0 - JFIF
      if (marker === 0xe0 && offset + 4 + 14 <= len) {
        const id = String.fromCharCode(
          view.getUint8(offset + 4),
          view.getUint8(offset + 5),
          view.getUint8(offset + 6),
          view.getUint8(offset + 7),
          view.getUint8(offset + 8)
        );
        if (id.startsWith('JFIF')) {
          const units = view.getUint8(offset + 11);
          const xDens = view.getUint16(offset + 12);
          const yDens = view.getUint16(offset + 14);

          if (units === 1 && xDens > 0 && yDens > 0) {
            jfifDpi = { dpiX: xDens, dpiY: yDens, unit: 'inch', sourceTag: 'JFIF APP0' };
          } else if (units === 2 && xDens > 0 && yDens > 0) {
            // dots per cm -> * 2.54
            jfifDpi = { dpiX: Math.round(xDens * 2.54), dpiY: Math.round(yDens * 2.54), unit: 'cm', sourceTag: 'JFIF APP0 (cm)' };
          }
        }
      }

      // APP1 - EXIF
      if (marker === 0xe1 && offset + 4 + 14 <= len) {
        const id = String.fromCharCode(
          view.getUint8(offset + 4),
          view.getUint8(offset + 5),
          view.getUint8(offset + 6),
          view.getUint8(offset + 7)
        );
        if (id === 'Exif') {
          const tiffStart = offset + 10;
          if (tiffStart + 8 < len) {
            const isLE = view.getUint16(tiffStart) === 0x4949; // 'II'
            const firstIFD = view.getUint32(tiffStart + 4, isLE);

            if (tiffStart + firstIFD + 2 < len) {
              const numEntries = view.getUint16(tiffStart + firstIFD, isLE);
              let xRes = 0;
              let yRes = 0;
              let resUnit = 2; // 2 = inches default in TIFF/EXIF

              for (let i = 0; i < numEntries; i++) {
                const entryOffset = tiffStart + firstIFD + 2 + i * 12;
                if (entryOffset + 12 > len) break;

                const tag = view.getUint16(entryOffset, isLE);
                const valOffset = view.getUint32(entryOffset + 8, isLE);

                // 0x011A = XResolution
                if (tag === 0x011a && tiffStart + valOffset + 8 <= len) {
                  const num = view.getUint32(tiffStart + valOffset, isLE);
                  const den = view.getUint32(tiffStart + valOffset + 4, isLE);
                  if (den > 0) xRes = Math.round(num / den);
                }
                // 0x011B = YResolution
                else if (tag === 0x011b && tiffStart + valOffset + 8 <= len) {
                  const num = view.getUint32(tiffStart + valOffset, isLE);
                  const den = view.getUint32(tiffStart + valOffset + 4, isLE);
                  if (den > 0) yRes = Math.round(num / den);
                }
                // 0x0128 = ResolutionUnit (2 = inch, 3 = cm)
                else if (tag === 0x0128) {
                  resUnit = view.getUint16(entryOffset + 8, isLE);
                }
              }

              if (xRes > 0 && yRes > 0) {
                if (resUnit === 3) {
                  exifDpi = { dpiX: Math.round(xRes * 2.54), dpiY: Math.round(yRes * 2.54), unit: 'cm', sourceTag: 'EXIF APP1 (cm)' };
                } else {
                  exifDpi = { dpiX: xRes, dpiY: yRes, unit: 'inch', sourceTag: 'EXIF APP1' };
                }
              }
            }
          }
        }
      }

      offset += 2 + segmentLen;
    }

    if (exifDpi) return { hasEmbeddedDpi: true, ...exifDpi };
    if (jfifDpi) return { hasEmbeddedDpi: true, ...jfifDpi };
  }

  // 3. Check BMP (Magic bytes 0x42, 0x4D)
  if (len > 54 && view.getUint8(0) === 0x42 && view.getUint8(1) === 0x4d) {
    const xPelsPerMeter = view.getInt32(38, true);
    const yPelsPerMeter = view.getInt32(42, true);
    if (xPelsPerMeter > 0 && yPelsPerMeter > 0) {
      const dpiX = Math.round(xPelsPerMeter * 0.0254);
      const dpiY = Math.round(yPelsPerMeter * 0.0254);
      return { hasEmbeddedDpi: true, dpiX, dpiY, sourceTag: 'BMP Header', unit: 'inch' };
    }
  }

  // 4. Default: No embedded DPI metadata found
  return {
    hasEmbeddedDpi: false,
    dpiX: 72,
    dpiY: 72,
    sourceTag: 'No Tag (Default 72 DPI)',
    unit: 'default',
  };
}

/**
 * Compute Standard Print Format Suitability Matrix
 */
export function calculatePrintSuitability(widthPx: number, heightPx: number): PrintFormatSuitability[] {
  const formats = [
    { id: 'passport', name: 'Passport / ID Photo', sizeInches: '2 × 2 in', sizeCm: '5.08 × 5.08 cm', widthInches: 2, heightInches: 2 },
    { id: 'photo_4x6', name: 'Standard Photo (4 × 6")', sizeInches: '4 × 6 in', sizeCm: '10.2 × 15.2 cm', widthInches: 6, heightInches: 4 },
    { id: 'photo_5x7', name: 'Medium Photo (5 × 7")', sizeInches: '5 × 7 in', sizeCm: '12.7 × 17.8 cm', widthInches: 7, heightInches: 5 },
    { id: 'photo_8x10', name: 'Portrait Photo (8 × 10")', sizeInches: '8 × 10 in', sizeCm: '20.3 × 25.4 cm', widthInches: 10, heightInches: 8 },
    { id: 'letter', name: 'US Letter Document', sizeInches: '8.5 × 11 in', sizeCm: '21.6 × 27.9 cm', widthInches: 11, heightInches: 8.5 },
    { id: 'a4', name: 'A4 Document / Print', sizeInches: '8.27 × 11.69 in', sizeCm: '21.0 × 29.7 cm', widthInches: 11.69, heightInches: 8.27 },
    { id: 'a3', name: 'A3 Poster / Art', sizeInches: '11.69 × 16.54 in', sizeCm: '29.7 × 42.0 cm', widthInches: 16.54, heightInches: 11.69 },
  ];

  const longestPx = Math.max(widthPx, heightPx);
  const shortestPx = Math.min(widthPx, heightPx);

  return formats.map((fmt) => {
    const targetLong = Math.max(fmt.widthInches, fmt.heightInches);
    const targetShort = Math.min(fmt.widthInches, fmt.heightInches);

    const effDpiLong = longestPx / targetLong;
    const effDpiShort = shortestPx / targetShort;
    const effDpi = Math.round(Math.min(effDpiLong, effDpiShort));

    let status: 'excellent' | 'good' | 'acceptable' | 'poor' = 'poor';
    if (effDpi >= 300) status = 'excellent';
    else if (effDpi >= 200) status = 'good';
    else if (effDpi >= 150) status = 'acceptable';

    return {
      id: fmt.id,
      name: fmt.name,
      sizeInches: fmt.sizeInches,
      sizeCm: fmt.sizeCm,
      widthInches: fmt.widthInches,
      heightInches: fmt.heightInches,
      reqWidth300: Math.round(fmt.widthInches * 300),
      reqHeight300: Math.round(fmt.heightInches * 300),
      effectiveDpi: effDpi,
      status,
    };
  });
}

/**
 * Load and analyze image DPI & dimensions from File
 */
export async function analyzeImageDpi(file: File): Promise<DpiMetadata> {
  const buffer = await file.arrayBuffer();
  const dpiInfo = extractDpiFromBuffer(buffer);

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const w = img.naturalWidth || 1;
      const h = img.naturalHeight || 1;
      const effDpi = dpiInfo.dpiX || 72;

      const printWIn = parseFloat((w / effDpi).toFixed(2));
      const printHIn = parseFloat((h / effDpi).toFixed(2));
      const printWCm = parseFloat((printWIn * 2.54).toFixed(2));
      const printHCm = parseFloat((printHIn * 2.54).toFixed(2));
      const printWMm = Math.round(printWCm * 10);
      const printHMm = Math.round(printHCm * 10);

      // Max 300 DPI calculations
      const max300InW = parseFloat((w / 300).toFixed(2));
      const max300InH = parseFloat((h / 300).toFixed(2));
      const max300CmW = parseFloat((max300InW * 2.54).toFixed(2));
      const max300CmH = parseFloat((max300InH * 2.54).toFixed(2));

      // Max 150 DPI calculations
      const max150InW = parseFloat((w / 150).toFixed(2));
      const max150InH = parseFloat((h / 150).toFixed(2));
      const max150CmW = parseFloat((max150InW * 2.54).toFixed(2));
      const max150CmH = parseFloat((max150InH * 2.54).toFixed(2));

      resolve({
        file,
        name: file.name,
        size: file.size,
        sizeFormatted: formatBytes(file.size),
        type: file.type || 'image/jpeg',
        width: w,
        height: h,
        aspectRatio: calculateAspectRatio(w, h),
        megapixels: parseFloat(((w * h) / 1_000_000).toFixed(2)),
        hasEmbeddedDpi: dpiInfo.hasEmbeddedDpi,
        sourceTag: dpiInfo.sourceTag,
        dpiX: dpiInfo.dpiX,
        dpiY: dpiInfo.dpiY,
        effectiveDpi: effDpi,
        unit: dpiInfo.unit,
        printWidthInches: printWIn,
        printHeightInches: printHIn,
        printWidthCm: printWCm,
        printHeightCm: printHCm,
        printWidthMm: printWMm,
        printHeightMm: printHMm,
        maxPrint300Inches: { width: max300InW, height: max300InH },
        maxPrint300Cm: { width: max300CmW, height: max300CmH },
        maxPrint150Inches: { width: max150InW, height: max150InH },
        maxPrint150Cm: { width: max150CmW, height: max150CmH },
        url,
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for DPI analysis.'));
    };

    img.src = url;
  });
}

/**
 * Generate 300 DPI Sample Canvas Image for 1-click testing
 */
export async function generate300DpiSample(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1800;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#1e1b4b');
  grad.addColorStop(1, '#065f46');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 12;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 80px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('300 DPI High-Resolution Print Sample', canvas.width / 2, 450);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = '50px monospace';
  ctx.fillText('1800 × 1200 px • 6 × 4 in (15.2 × 10.2 cm) @ 300 DPI', canvas.width / 2, 580);

  ctx.fillStyle = '#ffffff';
  ctx.font = '36px system-ui, sans-serif';
  ctx.fillText('ImgFeel.com Print Quality Diagnostic Asset', canvas.width / 2, 700);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob!], 'imgfeel-300dpi-sample.jpg', { type: 'image/jpeg' });
      resolve(file);
    }, 'image/jpeg', 0.95);
  });
}

/**
 * Generate 72 DPI Web Graphic Sample
 */
export async function generate72DpiSample(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#3b82f6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('72 DPI Web Display Graphic', canvas.width / 2, 260);

  ctx.fillStyle = '#93c5fd';
  ctx.font = '28px monospace';
  ctx.fillText('800 × 600 px • Standard Web Screen Density', canvas.width / 2, 340);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob!], 'imgfeel-72dpi-web-sample.png', { type: 'image/png' });
      resolve(file);
    }, 'image/png');
  });
}
