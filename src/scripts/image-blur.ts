/**
 * Client-Side Image Blur Engine
 * 100% In-Browser Privacy • Gaussian Blur, Privacy Redaction, Dreamy Glow & Motion Blur
 * Supports Full Image, Blur Selected Area Only, and Blur Background (Keep Area Sharp)
 */

export type BlurMode = 'gaussian' | 'privacy' | 'dreamy' | 'motion';
export type BlurScope = 'entire' | 'selected' | 'background';

export interface BlurSelection {
  x: number; // 0 to 1 (normalized) or px
  y: number;
  width: number;
  height: number;
}

export interface BlurOptions {
  mode: BlurMode;
  scope?: BlurScope;
  selection?: BlurSelection; // In 0..1 normalized coordinates or pixel coordinates
  radius: number; // 0 to 100 (px)
  brightness: number; // -100 to +100
  contrast: number; // -100 to +100
  format: 'image/jpeg' | 'image/png' | 'image/webp' | 'original';
  quality: number; // 0.1 to 1.0
}

export interface BlurResult {
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

/**
 * Internal helper to render the full blurred version of an image onto a target canvas.
 */
function renderFullBlurredCanvas(
  sourceImg: CanvasImageSource,
  targetCanvas: HTMLCanvasElement,
  options: BlurOptions
) {
  const width = targetCanvas.width;
  const height = targetCanvas.height;
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  const radius = Math.max(0, options.radius);
  const brightnessFilter = 100 + options.brightness;
  const contrastFilter = 100 + options.contrast;
  const adjFilter = `brightness(${brightnessFilter}%) contrast(${contrastFilter}%)`;

  switch (options.mode) {
    case 'privacy': {
      const heavyRadius = Math.max(8, radius * 1.5);
      ctx.filter = `blur(${heavyRadius}px) ${adjFilter}`;
      ctx.drawImage(sourceImg, 0, 0, width, height);
      ctx.filter = `blur(${heavyRadius * 0.75}px)`;
      ctx.drawImage(targetCanvas, 0, 0, width, height);
      break;
    }

    case 'dreamy': {
      ctx.filter = adjFilter;
      ctx.drawImage(sourceImg, 0, 0, width, height);

      if (radius > 0) {
        ctx.save();
        ctx.globalAlpha = 0.65;
        ctx.filter = `blur(${radius}px) brightness(110%)`;
        ctx.drawImage(sourceImg, 0, 0, width, height);
        ctx.restore();
      }
      break;
    }

    case 'motion': {
      if (radius === 0) {
        ctx.filter = adjFilter;
        ctx.drawImage(sourceImg, 0, 0, width, height);
      } else {
        const steps = Math.min(20, Math.max(6, Math.round(radius / 2)));
        const offsetRange = radius * 1.8;
        ctx.save();
        ctx.filter = adjFilter;
        ctx.globalAlpha = 1 / steps;
        for (let i = -steps / 2; i <= steps / 2; i++) {
          const offsetX = (i / steps) * offsetRange;
          ctx.drawImage(sourceImg, offsetX, 0, width, height);
        }
        ctx.restore();
      }
      break;
    }

    case 'gaussian':
    default: {
      ctx.filter = `blur(${radius}px) ${adjFilter}`;
      ctx.drawImage(sourceImg, 0, 0, width, height);
      break;
    }
  }

  ctx.filter = 'none';
}

/**
 * Applies blur and adjustments to a Canvas 2D context using high-performance Canvas filters.
 * Handles full canvas, selected area only, or background blur outside selection.
 */
export function applyBlurToCanvas(
  sourceImg: CanvasImageSource,
  targetCanvas: HTMLCanvasElement,
  options: BlurOptions
): void {
  const width = targetCanvas.width;
  const height = targetCanvas.height;
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  const scope = options.scope || 'entire';

  if (scope === 'entire' || !options.selection) {
    renderFullBlurredCanvas(sourceImg, targetCanvas, options);
    return;
  }

  // Calculate pixel bounds of selection box
  let selX = options.selection.x;
  let selY = options.selection.y;
  let selW = options.selection.width;
  let selH = options.selection.height;

  // If normalized (0..1), convert to pixel coords
  if (selX <= 1 && selY <= 1 && selW <= 1 && selH <= 1) {
    selX = selX * width;
    selY = selY * height;
    selW = selW * width;
    selH = selH * height;
  }

  // Ensure positive width & height
  if (selW < 0) {
    selX += selW;
    selW = Math.abs(selW);
  }
  if (selH < 0) {
    selY += selH;
    selH = Math.abs(selH);
  }

  // Create temporary offscreen canvas for the full blurred image
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;
  renderFullBlurredCanvas(sourceImg, offscreenCanvas, options);

  ctx.clearRect(0, 0, width, height);

  if (scope === 'selected') {
    // 1. Draw original crisp image across whole canvas
    ctx.drawImage(sourceImg, 0, 0, width, height);

    // 2. Draw blurred overlay ONLY inside the selection bounding box
    ctx.save();
    ctx.beginPath();
    ctx.rect(selX, selY, selW, selH);
    ctx.clip();
    ctx.drawImage(offscreenCanvas, 0, 0, width, height);
    ctx.restore();
  } else if (scope === 'background') {
    // 1. Draw blurred version across whole canvas
    ctx.drawImage(offscreenCanvas, 0, 0, width, height);

    // 2. Draw original crisp image ONLY inside the selection bounding box
    ctx.save();
    ctx.beginPath();
    ctx.rect(selX, selY, selW, selH);
    ctx.clip();
    ctx.drawImage(sourceImg, 0, 0, width, height);
    ctx.restore();
  }
}

/**
 * Processes a source image file and exports the blurred result.
 */
export async function blurImage(
  file: File,
  options: BlurOptions
): Promise<BlurResult> {
  const img = await loadImage(file);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  applyBlurToCanvas(img, canvas, options);

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
        else reject(new Error('Failed to generate blurred image blob.'));
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
 * Generates an interactive test image in-browser to showcase blurring effects.
 */
export async function generateSampleBlurImage(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;

  // Sunset landscape with deep mountains, sun, and crisp foreground elements
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 500);
  skyGrad.addColorStop(0, '#0f172a');
  skyGrad.addColorStop(0.4, '#312e81');
  skyGrad.addColorStop(0.7, '#c026d3');
  skyGrad.addColorStop(1, '#f97316');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 1200, 800);

  // Glowing Sun
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(600, 360, 90, 0, Math.PI * 2);
  ctx.fill();

  // Distant Mountain layer
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(0, 520);
  ctx.lineTo(240, 380);
  ctx.lineTo(480, 500);
  ctx.lineTo(760, 360);
  ctx.lineTo(1020, 510);
  ctx.lineTo(1200, 440);
  ctx.lineTo(1200, 800);
  ctx.lineTo(0, 800);
  ctx.closePath();
  ctx.fill();

  // Mid-range Mountain layer
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(0, 580);
  ctx.lineTo(360, 440);
  ctx.lineTo(680, 560);
  ctx.lineTo(950, 430);
  ctx.lineTo(1200, 550);
  ctx.lineTo(1200, 800);
  ctx.lineTo(0, 800);
  ctx.closePath();
  ctx.fill();

  // Foreground Lake / Floor
  const waterGrad = ctx.createLinearGradient(0, 600, 0, 800);
  waterGrad.addColorStop(0, '#090d16');
  waterGrad.addColorStop(1, '#020617');
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, 600, 1200, 200);

  // Crisp Geometric Badge with Sensitive Details to test redaction
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.roundRect(380, 200, 440, 280, 20);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CONFIDENTIAL ID CARD', 600, 250);

  ctx.font = '16px monospace';
  ctx.fillStyle = '#475569';
  ctx.fillText('ID: 8492-9930-1102-4912', 600, 290);
  ctx.fillText('NAME: JANE DOE (VERIFIED)', 600, 325);
  ctx.fillText('LOCATION: NEW YORK, NY', 600, 360);

  // Secure Badge Stamp
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.roundRect(500, 395, 200, 44, 8);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('SECURE DOCUMENT', 600, 423);

  // Header Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('IMAGE BLUR & BOKEH TEST', 600, 90);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('IMGFEEL.COM', 600, 750);

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/png')
  );
  return new File([blob], 'sample-blur-test.png', { type: 'image/png' });
}
