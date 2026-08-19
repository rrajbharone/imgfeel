/**
 * Client-Side Image Inverter Engine
 * 100% In-Browser Privacy • Full RGB Negative, Luminance Inversion & Channel Operations
 */

export type InvertMode =
  | 'full'
  | 'luminance'
  | 'grayscale-invert'
  | 'invert-red'
  | 'invert-green'
  | 'invert-blue';

export interface InvertOptions {
  mode: InvertMode;
  intensity: number; // 0 to 100 (%)
  brightness: number; // -100 to +100
  contrast: number; // -100 to +100
  format: 'image/jpeg' | 'image/png' | 'image/webp' | 'original';
  quality: number; // 0.1 to 1.0
}

export interface InvertResult {
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

// Convert RGB (0-255) to HSL (H: 0-360, S: 0-1, L: 0-1)
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

// Helper for HSL to RGB
function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

// Convert HSL back to RGB (0-255)
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hNorm = h / 360;
  let r = l;
  let g = l;
  let b = l;

  if (s !== 0) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, hNorm + 1 / 3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Transforms an image buffer using pixel-level inversion algorithms.
 */
export function applyInversionToImageData(
  imageData: ImageData,
  options: InvertOptions
): void {
  const data = imageData.data;
  const len = data.length;
  const intensity = options.intensity / 100;
  const brightnessOffset = options.brightness * 2.55;

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

    switch (options.mode) {
      case 'luminance': {
        // Invert only perceived lightness in HSL space
        const [h, s, l] = rgbToHsl(r, g, b);
        const invertedL = Math.max(0, Math.min(1, 1 - l));
        const [nr, ng, nb] = hslToRgb(h, s, invertedL);
        targetR = nr;
        targetG = ng;
        targetB = nb;
        break;
      }
      case 'grayscale-invert': {
        // ITU-R BT.709 luminance inverted
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const invLum = clamp(255 - lum);
        targetR = invLum;
        targetG = invLum;
        targetB = invLum;
        break;
      }
      case 'invert-red': {
        targetR = 255 - r;
        targetG = g;
        targetB = b;
        break;
      }
      case 'invert-green': {
        targetR = r;
        targetG = 255 - g;
        targetB = b;
        break;
      }
      case 'invert-blue': {
        targetR = r;
        targetG = g;
        targetB = 255 - b;
        break;
      }
      case 'full':
      default: {
        // Standard full RGB negative
        targetR = 255 - r;
        targetG = 255 - g;
        targetB = 255 - b;
        break;
      }
    }

    // Blend with original using intensity slider
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
 * Inverts a source image file and exports it as a blob.
 */
export async function invertImage(
  file: File,
  options: InvertOptions
): Promise<InvertResult> {
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

  // Draw original
  ctx.drawImage(img, 0, 0, width, height);

  // Apply pixel manipulation
  const imageData = ctx.getImageData(0, 0, width, height);
  applyInversionToImageData(imageData, options);
  ctx.putImageData(imageData, 0, 0);

  // Determine export MIME
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
        else reject(new Error('Failed to generate inverted image blob.'));
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
 * Generates an interactive test image in-browser to showcase inversion.
 */
export async function generateSampleInvertImage(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;

  // Dark background with glowing neon shapes and text
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1200, 800);

  // Decorative geometric backdrop
  const grad = ctx.createLinearGradient(0, 0, 1200, 800);
  grad.addColorStop(0, '#3b82f6');
  grad.addColorStop(0.5, '#8b5cf6');
  grad.addColorStop(1, '#ec4899');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(600, 400, 260, 0, Math.PI * 2);
  ctx.fill();

  // White inner circle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(600, 400, 180, 0, Math.PI * 2);
  ctx.fill();

  // Dark center badge
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(600, 400, 130, 0, Math.PI * 2);
  ctx.fill();

  // Sun / Aperture icon
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(600, 400, 60, 0, Math.PI * 2);
  ctx.fill();

  // Text details
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('COLOR INVERSION TEST', 600, 120);

  ctx.font = '22px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('RGB Negative • Luminance Invert • Channel Separation', 600, 170);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('IMGFEEL.COM', 600, 720);

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/png')
  );
  return new File([blob], 'sample-inversion-test.png', { type: 'image/png' });
}
