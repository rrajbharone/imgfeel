/**
 * Freeform Image Cropping Engine
 * 100% Client-Side Canvas 2D precision image cropping, multi-handle dragging,
 * aspect ratio locking, rotation, flipping, and high-DPI export.
 */

export type AspectRatioPreset =
  | 'free'
  | 'original'
  | '1:1'
  | '4:3'
  | '16:9'
  | '9:16'
  | '3:2'
  | '2:3'
  | '5:4'
  | '21:9';

export type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move' | null;

export type ExportFormat = 'image/png' | 'image/webp' | 'image/jpeg';

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TransformState {
  rotation: number; // 0, 90, 180, 270 or fine degrees
  flipH: boolean;
  flipV: boolean;
  zoom: number; // 1.0 = 100%
}

export interface LoadedImageInfo {
  img: HTMLImageElement;
  name: string;
  originalWidth: number;
  originalHeight: number;
  fileSize: number;
  fileType: string;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Parses numeric aspect ratio from preset string
 */
export function getNumericAspectRatio(
  preset: AspectRatioPreset,
  imgWidth: number,
  imgHeight: number
): number | null {
  if (preset === 'free') return null;
  if (preset === 'original') return imgWidth / imgHeight;
  if (preset === '1:1') return 1;
  if (preset === '4:3') return 4 / 3;
  if (preset === '16:9') return 16 / 9;
  if (preset === '9:16') return 9 / 16;
  if (preset === '3:2') return 3 / 2;
  if (preset === '2:3') return 2 / 3;
  if (preset === '5:4') return 5 / 4;
  if (preset === '21:9') return 21 / 9;
  return null;
}

/**
 * Initialize a centered crop box inside bounds respecting aspect ratio
 */
export function createInitialCropBox(
  bounds: Bounds,
  ratio: number | null,
  marginFraction = 0.85
): CropBox {
  let w = bounds.width * marginFraction;
  let h = bounds.height * marginFraction;

  if (ratio !== null && ratio > 0) {
    if (w / h > ratio) {
      w = h * ratio;
    } else {
      h = w / ratio;
    }
  }

  w = Math.max(20, Math.min(bounds.width, w));
  h = Math.max(20, Math.min(bounds.height, h));

  const x = bounds.x + (bounds.width - w) / 2;
  const y = bounds.y + (bounds.height - h) / 2;

  return { x, y, width: w, height: h };
}

/**
 * Calculate coordinates for a single handle or move action on drag
 */
export function updateCropBoxFromDrag(
  handle: HandleType,
  startBox: CropBox,
  deltaX: number,
  deltaY: number,
  bounds: Bounds,
  ratio: number | null
): CropBox {
  if (!handle) return { ...startBox };

  const minSize = 24;

  if (handle === 'move') {
    const newX = clamp(startBox.x + deltaX, bounds.x, bounds.x + bounds.width - startBox.width);
    const newY = clamp(startBox.y + deltaY, bounds.y, bounds.y + bounds.height - startBox.height);
    return { ...startBox, x: newX, y: newY };
  }

  let { x, y, width, height } = startBox;
  const right = x + width;
  const bottom = y + height;

  // Unconstrained resize first
  if (handle.includes('e')) {
    width = clamp(startBox.width + deltaX, minSize, bounds.x + bounds.width - x);
  }
  if (handle.includes('s')) {
    height = clamp(startBox.height + deltaY, minSize, bounds.y + bounds.height - y);
  }
  if (handle.includes('w')) {
    const desiredX = clamp(startBox.x + deltaX, bounds.x, right - minSize);
    width = right - desiredX;
    x = desiredX;
  }
  if (handle.includes('n')) {
    const desiredY = clamp(startBox.y + deltaY, bounds.y, bottom - minSize);
    height = bottom - desiredY;
    y = desiredY;
  }

  // If aspect ratio is locked, adjust dimensions symmetrically or along drag direction
  if (ratio !== null && ratio > 0) {
    if (handle === 'e' || handle === 'w') {
      height = width / ratio;
      // Clamp height to bounds
      if (y + height > bounds.y + bounds.height) {
        height = bounds.y + bounds.height - y;
        width = height * ratio;
        if (handle === 'w') x = right - width;
      }
    } else if (handle === 's' || handle === 'n') {
      width = height * ratio;
      // Clamp width to bounds
      if (x + width > bounds.x + bounds.width) {
        width = bounds.x + bounds.width - x;
        height = width / ratio;
        if (handle === 'n') y = bottom - height;
      }
    } else {
      // Corner handles (se, sw, ne, nw)
      const currentRatio = width / height;
      if (currentRatio > ratio) {
        width = height * ratio;
      } else {
        height = width / ratio;
      }

      if (handle.includes('w')) x = right - width;
      if (handle.includes('n')) y = bottom - height;
    }
  }

  // Final sanity clamp to container bounds
  x = clamp(x, bounds.x, bounds.x + bounds.width - minSize);
  y = clamp(y, bounds.y, bounds.y + bounds.height - minSize);
  width = clamp(width, minSize, bounds.x + bounds.width - x);
  height = clamp(height, minSize, bounds.y + bounds.height - y);

  return { x, y, width, height };
}

/**
 * Load an image file into an HTMLImageElement with metadata
 */
export function loadImageFile(file: File): Promise<LoadedImageInfo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        resolve({
          img,
          name: file.name,
          originalWidth: img.naturalWidth || img.width,
          originalHeight: img.naturalHeight || img.height,
          fileSize: file.size,
          fileType: file.type || 'image/png',
        });
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/**
 * Generate a high-resolution cropped image on an offscreen canvas
 */
export function generateCroppedCanvas(
  sourceImg: HTMLImageElement,
  cropBox: CropBox,
  displayedBounds: Bounds,
  transform: TransformState
): HTMLCanvasElement {
  const origW = sourceImg.naturalWidth || sourceImg.width;
  const origH = sourceImg.naturalHeight || sourceImg.height;

  // Compute mapping scale from displayed image area to real image pixel dimensions
  const scaleX = origW / displayedBounds.width;
  const scaleY = origH / displayedBounds.height;

  // Real pixel crop rectangle
  const realCropX = Math.round((cropBox.x - displayedBounds.x) * scaleX);
  const realCropY = Math.round((cropBox.y - displayedBounds.y) * scaleY);
  const realCropW = Math.max(1, Math.round(cropBox.width * scaleX));
  const realCropH = Math.max(1, Math.round(cropBox.height * scaleY));

  // Intermediate canvas for transformation (rotation/flip)
  const transformCanvas = document.createElement('canvas');
  const rot = ((transform.rotation % 360) + 360) % 360;
  const isPerpendicular = rot === 90 || rot === 270;

  transformCanvas.width = isPerpendicular ? origH : origW;
  transformCanvas.height = isPerpendicular ? origW : origH;

  const tCtx = transformCanvas.getContext('2d');
  if (tCtx) {
    tCtx.save();
    tCtx.translate(transformCanvas.width / 2, transformCanvas.height / 2);
    tCtx.rotate((rot * Math.PI) / 180);
    tCtx.scale(transform.flipH ? -1 : 1, transform.flipV ? -1 : 1);
    tCtx.drawImage(sourceImg, -origW / 2, -origH / 2, origW, origH);
    tCtx.restore();
  }

  // Final cropped output canvas
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = realCropW;
  outputCanvas.height = realCropH;

  const outCtx = outputCanvas.getContext('2d', { alpha: true });
  if (outCtx) {
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';
    outCtx.drawImage(
      transformCanvas,
      realCropX,
      realCropY,
      realCropW,
      realCropH,
      0,
      0,
      realCropW,
      realCropH
    );
  }

  return outputCanvas;
}

/**
 * Generate a vibrant sample demo image using Canvas for 1-click testing
 */
export function generateSampleDemoImage(): Promise<LoadedImageInfo> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d')!;

    // Sunset Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 800);
    skyGrad.addColorStop(0, '#0f172a');
    skyGrad.addColorStop(0.35, '#3b0764');
    skyGrad.addColorStop(0.65, '#c026d3');
    skyGrad.addColorStop(0.85, '#f97316');
    skyGrad.addColorStop(1, '#fde047');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1200, 800);

    // Glowing Sun
    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(600, 520, 140, 0, Math.PI * 2);
    ctx.fill();

    // Mountain silhouettes in layers
    ctx.fillStyle = 'rgba(76, 29, 149, 0.45)';
    ctx.beginPath();
    ctx.moveTo(0, 800);
    ctx.lineTo(0, 560);
    ctx.lineTo(240, 480);
    ctx.lineTo(500, 580);
    ctx.lineTo(820, 460);
    ctx.lineTo(1050, 550);
    ctx.lineTo(1200, 500);
    ctx.lineTo(1200, 800);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(0, 800);
    ctx.lineTo(0, 640);
    ctx.lineTo(320, 540);
    ctx.lineTo(600, 680);
    ctx.lineTo(940, 560);
    ctx.lineTo(1200, 660);
    ctx.lineTo(1200, 800);
    ctx.closePath();
    ctx.fill();

    // Center badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ImgFeel Freeform Cropper Demo', 600, 240);

    ctx.font = '500 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText('1200 × 800 px • Drag crop handles to test any aspect ratio', 600, 290);

    const img = new Image();
    img.onload = () => {
      resolve({
        img,
        name: 'sample-landscape-demo.png',
        originalWidth: 1200,
        originalHeight: 800,
        fileSize: 184000,
        fileType: 'image/png',
      });
    };
    img.src = canvas.toDataURL('image/png');
  });
}

/**
 * Export canvas to Blob or Data URL for download
 */
export async function exportCroppedImage(
  canvas: HTMLCanvasElement,
  format: ExportFormat = 'image/png',
  quality = 0.92,
  filename = 'imgfeel-cropped'
): Promise<void> {
  const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
  const fullFilename = `${filename}-${canvas.width}x${canvas.height}.${ext}`;

  if (canvas.toBlob) {
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fullFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      },
      format,
      quality
    );
  } else {
    const dataUrl = canvas.toDataURL(format, quality);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fullFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Copy cropped image directly to system clipboard as image/png
 */
export async function copyCroppedImageToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    return false;
  }

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        resolve(true);
      } catch {
        resolve(false);
      }
    }, 'image/png');
  });
}
