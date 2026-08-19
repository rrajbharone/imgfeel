/**
 * Client-Side Grayscale & Monochrome Image Converter Engine
 * 100% In-Browser Privacy • ITU-R BT.709 Photometric Luminance & Tone Mapping
 */

export type GrayscalePreset = 'luminance' | 'high-contrast' | 'sepia' | 'cool' | 'average';

export interface GrayscaleOptions {
  preset: GrayscalePreset;
  intensity: number; // 0 to 100 (%)
  brightness: number; // -100 to +100
  contrast: number; // -100 to +100
  format: 'image/jpeg' | 'image/png' | 'image/webp' | 'original';
  quality: number; // 0.1 to 1.0
}

export interface GrayscaleResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  fileSize: number;
  fileSizeFormatted: string;
  originalWidth: number;
  originalHeight: number;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file.'));
    };
    img.src = url;
  });
}

function clamp(val: number, min = 0, max = 255): number {
  return Math.min(max, Math.max(min, val));
}

/**
 * Transforms an image buffer into grayscale/monochrome using pixel-level calculations.
 */
export function applyGrayscaleToImageData(
  imageData: ImageData,
  options: GrayscaleOptions
): void {
  const data = imageData.data;
  const len = data.length;
  const intensity = options.intensity / 100;
  const brightnessOffset = options.brightness * 2.55; // -255 to +255
  
  // Contrast factor
  const c = Math.max(-100, Math.min(100, options.contrast));
  const contrastFactor = (259 * (c + 255)) / (255 * (259 - c));

  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip fully transparent pixels
    if (a === 0) continue;

    let targetR = r;
    let targetG = g;
    let targetB = b;

    switch (options.preset) {
      case 'average': {
        const avg = (r + g + b) / 3;
        targetR = avg;
        targetG = avg;
        targetB = avg;
        break;
      }
      case 'high-contrast': {
        // Photometric luminance with boosted S-curve
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const boosted = 1.35 * (lum - 128) + 128;
        targetR = clamp(boosted);
        targetG = clamp(boosted);
        targetB = clamp(boosted);
        break;
      }
      case 'sepia': {
        targetR = clamp(0.393 * r + 0.769 * g + 0.189 * b);
        targetG = clamp(0.349 * r + 0.686 * g + 0.168 * b);
        targetB = clamp(0.272 * r + 0.534 * g + 0.131 * b);
        break;
      }
      case 'cool': {
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        targetR = clamp(lum * 0.9);
        targetG = clamp(lum * 0.96);
        targetB = clamp(lum * 1.15 + 8);
        break;
      }
      case 'luminance':
      default: {
        // Standard ITU-R BT.709 perceptual photometric formula
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        targetR = lum;
        targetG = lum;
        targetB = lum;
        break;
      }
    }

    // Apply intensity blend
    let outR = r + (targetR - r) * intensity;
    let outG = g + (targetG - g) * intensity;
    let outB = b + (targetB - b) * intensity;

    // Apply Brightness
    if (options.brightness !== 0) {
      outR += brightnessOffset;
      outG += brightnessOffset;
      outB += brightnessOffset;
    }

    // Apply Contrast
    if (options.contrast !== 0) {
      outR = contrastFactor * (outR - 128) + 128;
      outG = contrastFactor * (outG - 128) + 128;
      outB = contrastFactor * (outB - 128) + 128;
    }

    data[i] = clamp(Math.round(outR));
    data[i + 1] = clamp(Math.round(outG));
    data[i + 2] = clamp(Math.round(outB));
  }
}

/**
 * Converts a source file to grayscale and exports it as a blob.
 */
export async function convertImageToGrayscale(
  file: File,
  options: GrayscaleOptions
): Promise<GrayscaleResult> {
  const img = await loadImage(file);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas 2D context not supported.');
  }

  // Draw original image
  ctx.drawImage(img, 0, 0, width, height);

  // Manipulate pixels
  const imageData = ctx.getImageData(0, 0, width, height);
  applyGrayscaleToImageData(imageData, options);
  ctx.putImageData(imageData, 0, 0);

  // Determine export MIME type
  let exportMime = options.format;
  if (exportMime === 'original') {
    if (file.type && (file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/jpeg')) {
      exportMime = file.type;
    } else {
      exportMime = 'image/jpeg';
    }
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to generate grayscale image blob.'));
      },
      exportMime,
      options.quality
    );
  });

  const dataUrl = canvas.toDataURL(exportMime, options.quality);

  return {
    blob,
    dataUrl,
    width,
    height,
    fileSize: blob.size,
    fileSizeFormatted: formatBytes(blob.size),
    originalWidth: width,
    originalHeight: height,
  };
}

/**
 * Generates an interactive colorful test image in-browser.
 */
export async function generateSampleColorImage(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;

  // Dynamic rich landscape with sky, sunset gradient, mountains, and sun
  const skyGrad = ctx.createLinearGradient(0, 0, 1200, 500);
  skyGrad.addColorStop(0, '#1e3a8a');
  skyGrad.addColorStop(0.35, '#8b5cf6');
  skyGrad.addColorStop(0.7, '#f97316');
  skyGrad.addColorStop(1, '#fde047');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 1200, 500);

  // Glowing Sun
  const sunGrad = ctx.createRadialGradient(600, 320, 10, 600, 320, 160);
  sunGrad.addColorStop(0, '#ffffff');
  sunGrad.addColorStop(0.3, '#ffedd5');
  sunGrad.addColorStop(0.8, '#f59e0b');
  sunGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(600, 320, 160, 0, Math.PI * 2);
  ctx.fill();

  // Mountain layer 1 (Distant Purple)
  ctx.fillStyle = '#4c1d95';
  ctx.beginPath();
  ctx.moveTo(0, 500);
  ctx.lineTo(250, 260);
  ctx.lineTo(550, 480);
  ctx.lineTo(850, 240);
  ctx.lineTo(1200, 450);
  ctx.lineTo(1200, 500);
  ctx.closePath();
  ctx.fill();

  // Mountain layer 2 (Deep Indigo)
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.moveTo(0, 500);
  ctx.lineTo(150, 360);
  ctx.lineTo(450, 500);
  ctx.lineTo(700, 340);
  ctx.lineTo(1050, 500);
  ctx.closePath();
  ctx.fill();

  // Lake with reflections
  const lakeGrad = ctx.createLinearGradient(0, 500, 0, 800);
  lakeGrad.addColorStop(0, '#0284c7');
  lakeGrad.addColorStop(0.5, '#0369a1');
  lakeGrad.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = lakeGrad;
  ctx.fillRect(0, 500, 1200, 300);

  // Foreground colorful flowers & trees
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.arc(100, 780, 120, 0, Math.PI * 2);
  ctx.arc(280, 820, 150, 0, Math.PI * 2);
  ctx.arc(1100, 800, 140, 0, Math.PI * 2);
  ctx.fill();

  // Red & Yellow flower blooms
  const colors = ['#ef4444', '#ec4899', '#eab308', '#06b6d4', '#f97316'];
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 1200;
    const y = 680 + Math.random() * 110;
    const r = 5 + Math.random() * 8;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sample watermark
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Sample Sunset Landscape • Test Grayscale Converter', 600, 760);

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95)
  );
  return new File([blob], 'sample-sunset-landscape.jpg', { type: 'image/jpeg' });
}
