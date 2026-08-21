/**
 * Client-Side Image Overlay Engine for ImgFeel.com
 * 100% In-Browser Privacy, HTML5 Canvas 2D Composite Rendering
 */

export type AlignmentPreset =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'custom';

export type BlendMode =
  | 'source-over'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

export interface OverlayOptions {
  x: number;
  y: number;
  alignment: AlignmentPreset;
  margin: number;
  scale: number;
  rotation: number;
  opacity: number;
  blendMode: BlendMode;
  canvasFit: 'base' | 'overlay';
  bgColor: string;
  flipH: boolean;
  flipV: boolean;
  format?: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
}

export const BLEND_MODES: { id: BlendMode; label: string; group: string }[] = [
  { id: 'source-over', label: 'Normal (Standard)', group: 'Basic' },
  { id: 'multiply', label: 'Multiply (Darken)', group: 'Darken' },
  { id: 'darken', label: 'Darken Only', group: 'Darken' },
  { id: 'color-burn', label: 'Color Burn', group: 'Darken' },
  { id: 'screen', label: 'Screen (Lighten)', group: 'Lighten' },
  { id: 'lighten', label: 'Lighten Only', group: 'Lighten' },
  { id: 'color-dodge', label: 'Color Dodge', group: 'Lighten' },
  { id: 'overlay', label: 'Overlay (Contrast)', group: 'Contrast' },
  { id: 'soft-light', label: 'Soft Light', group: 'Contrast' },
  { id: 'hard-light', label: 'Hard Light', group: 'Contrast' },
  { id: 'difference', label: 'Difference (Invert)', group: 'Special' },
  { id: 'exclusion', label: 'Exclusion', group: 'Special' },
];

/**
 * Calculates (X, Y) top-left coordinates for an alignment preset
 */
export function calculateAlignmentCoords(
  baseWidth: number,
  baseHeight: number,
  overlayScaledWidth: number,
  overlayScaledHeight: number,
  alignment: AlignmentPreset,
  margin: number
): { x: number; y: number } {
  let x = margin;
  let y = margin;

  switch (alignment) {
    case 'top-left':
      x = margin;
      y = margin;
      break;
    case 'top-center':
      x = (baseWidth - overlayScaledWidth) / 2;
      y = margin;
      break;
    case 'top-right':
      x = baseWidth - overlayScaledWidth - margin;
      y = margin;
      break;
    case 'center-left':
      x = margin;
      y = (baseHeight - overlayScaledHeight) / 2;
      break;
    case 'center':
      x = (baseWidth - overlayScaledWidth) / 2;
      y = (baseHeight - overlayScaledHeight) / 2;
      break;
    case 'center-right':
      x = baseWidth - overlayScaledWidth - margin;
      y = (baseHeight - overlayScaledHeight) / 2;
      break;
    case 'bottom-left':
      x = margin;
      y = baseHeight - overlayScaledHeight - margin;
      break;
    case 'bottom-center':
      x = (baseWidth - overlayScaledWidth) / 2;
      y = baseHeight - overlayScaledHeight - margin;
      break;
    case 'bottom-right':
      x = baseWidth - overlayScaledWidth - margin;
      y = baseHeight - overlayScaledHeight - margin;
      break;
    case 'custom':
    default:
      break;
  }

  return { x: Math.round(x), y: Math.round(y) };
}

/**
 * Renders base and overlay layers onto a canvas
 */
export function renderOverlayToCanvas(
  canvas: HTMLCanvasElement,
  baseImg: HTMLImageElement | ImageBitmap | null,
  overlayImg: HTMLImageElement | ImageBitmap | null,
  options: OverlayOptions
): {
  canvasWidth: number;
  canvasHeight: number;
  overlayWidth: number;
  overlayHeight: number;
  overlayX: number;
  overlayY: number;
} {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { canvasWidth: 0, canvasHeight: 0, overlayWidth: 0, overlayHeight: 0, overlayX: 0, overlayY: 0 };
  }

  // 1. Determine Canvas Dimensions
  let cWidth = 800;
  let cHeight = 600;

  if (baseImg) {
    cWidth = baseImg.width;
    cHeight = baseImg.height;
  } else if (overlayImg) {
    cWidth = overlayImg.width;
    cHeight = overlayImg.height;
  }

  canvas.width = cWidth;
  canvas.height = cHeight;

  ctx.clearRect(0, 0, cWidth, cHeight);

  // 2. Draw Background fill if set
  if (options.bgColor && options.bgColor !== 'transparent') {
    ctx.fillStyle = options.bgColor;
    ctx.fillRect(0, 0, cWidth, cHeight);
  }

  // 3. Draw Base Layer
  if (baseImg) {
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(baseImg, 0, 0, cWidth, cHeight);
    ctx.restore();
  }

  // 4. Draw Overlay Layer
  let overlayScaledW = 0;
  let overlayScaledH = 0;
  let finalX = options.x;
  let finalY = options.y;

  if (overlayImg) {
    overlayScaledW = Math.round(overlayImg.width * options.scale);
    overlayScaledH = Math.round(overlayImg.height * options.scale);

    if (options.alignment !== 'custom') {
      const coords = calculateAlignmentCoords(
        cWidth,
        cHeight,
        overlayScaledW,
        overlayScaledH,
        options.alignment,
        options.margin
      );
      finalX = coords.x;
      finalY = coords.y;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, options.opacity));
    ctx.globalCompositeOperation = options.blendMode || 'source-over';

    const centerX = finalX + overlayScaledW / 2;
    const centerY = finalY + overlayScaledH / 2;

    ctx.translate(centerX, centerY);

    if (options.rotation !== 0) {
      ctx.rotate((options.rotation * Math.PI) / 180);
    }

    const scaleX = options.flipH ? -1 : 1;
    const scaleY = options.flipV ? -1 : 1;
    if (scaleX !== 1 || scaleY !== 1) {
      ctx.scale(scaleX, scaleY);
    }

    ctx.drawImage(
      overlayImg,
      -overlayScaledW / 2,
      -overlayScaledH / 2,
      overlayScaledW,
      overlayScaledH
    );

    ctx.restore();
  }

  return {
    canvasWidth: cWidth,
    canvasHeight: cHeight,
    overlayWidth: overlayScaledW,
    overlayHeight: overlayScaledH,
    overlayX: finalX,
    overlayY: finalY,
  };
}

/**
 * Exports composite canvas to Blob & Data URL
 */
export async function exportCompositeImage(
  baseImg: HTMLImageElement | ImageBitmap | null,
  overlayImg: HTMLImageElement | ImageBitmap | null,
  options: OverlayOptions
): Promise<{ dataUrl: string; blob: Blob; size: number; width: number; height: number }> {
  const canvas = document.createElement('canvas');
  const meta = renderOverlayToCanvas(canvas, baseImg, overlayImg, options);

  const format = options.format || 'image/png';
  const quality = options.quality ?? 0.92;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas rendering failed'));
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            dataUrl: reader.result as string,
            blob,
            size: blob.size,
            width: meta.canvasWidth,
            height: meta.canvasHeight,
          });
        };
        reader.onerror = () => reject(new Error('FileReader failed'));
        reader.readAsDataURL(blob);
      },
      format,
      quality
    );
  });
}

/**
 * Copies composite PNG directly to clipboard
 */
export async function copyCompositeToClipboard(
  baseImg: HTMLImageElement | ImageBitmap | null,
  overlayImg: HTMLImageElement | ImageBitmap | null,
  options: OverlayOptions
): Promise<void> {
  const canvas = document.createElement('canvas');
  renderOverlayToCanvas(canvas, baseImg, overlayImg, options);

  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Could not create PNG blob'));
        return;
      }
      try {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        resolve();
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}

/**
 * Helper to load an image file into an HTMLImageElement
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}
