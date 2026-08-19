/**
 * Client-Side Square (1:1) Image Resizing Engine
 * 100% In-Browser Privacy • High-Quality Multi-Step Canvas Interpolation
 */

export type SquareMode = 'fit-pad' | 'crop-fill' | 'stretch';
export type BgFillType = 'solid' | 'blur' | 'transparent';
export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export interface SquareResizeOptions {
  targetSize: number; // e.g. 1080 for 1080x1080
  mode: SquareMode;
  bgType: BgFillType;
  bgColor: string; // Hex color e.g. '#ffffff'
  format: OutputFormat;
  quality: number; // 0.1 to 1.0
}

export interface ResizeResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  fileSize: number;
  fileSizeFormatted: string;
  originalWidth: number;
  originalHeight: number;
  originalFileSize: number;
  originalFileSizeFormatted: string;
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
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file.'));
    };
    img.src = url;
  });
}

/**
 * Resizes an image into a perfect 1:1 square canvas using HTML5 Canvas.
 */
export async function resizeImageToSquare(
  file: File,
  options: SquareResizeOptions
): Promise<ResizeResult> {
  const img = await loadImage(file);
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  const targetSize = Math.max(16, Math.min(8000, Math.round(options.targetSize)));
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas 2D rendering context not supported.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. FIT & PAD MODE (Letterbox/Pillarbox without cropping)
  if (options.mode === 'fit-pad') {
    // Fill Background
    if (options.bgType === 'solid') {
      ctx.fillStyle = options.bgColor || '#ffffff';
      ctx.fillRect(0, 0, targetSize, targetSize);
    } else if (options.bgType === 'blur') {
      // Create frosted blurred background using original image
      ctx.save();
      ctx.filter = `blur(${Math.max(12, Math.round(targetSize * 0.03))}px)`;
      // Draw zoomed original image to cover square canvas
      const bgScale = Math.max(targetSize / origW, targetSize / origH) * 1.15;
      const bgW = origW * bgScale;
      const bgH = origH * bgScale;
      const bgX = (targetSize - bgW) / 2;
      const bgY = (targetSize - bgH) / 2;
      ctx.drawImage(img, bgX, bgY, bgW, bgH);
      ctx.restore();

      // Subtle dark/light tint overlay for clean contrast
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, targetSize, targetSize);
    } else if (options.bgType === 'transparent') {
      // Clear canvas (Transparent for PNG/WebP)
      ctx.clearRect(0, 0, targetSize, targetSize);
    }

    // Calculate aspect-ratio preserving dimensions
    const scale = Math.min(targetSize / origW, targetSize / origH);
    const drawW = Math.round(origW * scale);
    const drawH = Math.round(origH * scale);
    const drawX = Math.round((targetSize - drawW) / 2);
    const drawY = Math.round((targetSize - drawH) / 2);

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  // 2. FILL & CROP MODE (Center crop without padding/bars)
  else if (options.mode === 'crop-fill') {
    const scale = Math.max(targetSize / origW, targetSize / origH);
    const srcCropW = targetSize / scale;
    const srcCropH = targetSize / scale;
    const srcX = (origW - srcCropW) / 2;
    const srcY = (origH - srcCropH) / 2;

    ctx.drawImage(
      img,
      srcX,
      srcY,
      srcCropW,
      srcCropH,
      0,
      0,
      targetSize,
      targetSize
    );
  }

  // 3. STRETCH MODE
  else if (options.mode === 'stretch') {
    ctx.drawImage(img, 0, 0, targetSize, targetSize);
  }

  // Ensure format compatibility with transparency
  let finalFormat = options.format;
  if (options.mode === 'fit-pad' && options.bgType === 'transparent' && finalFormat === 'image/jpeg') {
    finalFormat = 'image/png'; // Fallback to PNG so transparency is preserved
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to generate output image blob.'));
      },
      finalFormat,
      options.quality
    );
  });

  const dataUrl = canvas.toDataURL(finalFormat, options.quality);

  return {
    blob,
    dataUrl,
    width: targetSize,
    height: targetSize,
    fileSize: blob.size,
    fileSizeFormatted: formatBytes(blob.size),
    originalWidth: origW,
    originalHeight: origH,
    originalFileSize: file.size,
    originalFileSizeFormatted: formatBytes(file.size),
  };
}

/**
 * 1-Click Interactive In-Browser Sample Image Generator
 */
export async function generateSampleLandscape(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;

  // Vibrant gradient background
  const grad = ctx.createLinearGradient(0, 0, 1200, 800);
  grad.addColorStop(0, '#3b82f6');
  grad.addColorStop(0.5, '#8b5cf6');
  grad.addColorStop(1, '#ec4899');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 800);

  // Decorative shapes
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.arc(200, 200, 140, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(1050, 600, 200, 0, Math.PI * 2);
  ctx.fill();

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Sample 3:2 Landscape Image', 600, 380);

  ctx.font = '22px sans-serif';
  ctx.fillText('1200 × 800 px • Test 1:1 Square Resizing', 600, 440);

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92)
  );
  return new File([blob], 'sample-landscape-1200x800.jpg', { type: 'image/jpeg' });
}
