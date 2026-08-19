/**
 * Client-Side Circular Image Cropper Engine
 * 100% In-Browser Privacy • Transparent PNG/WebP Alpha Cutouts & Ring Borders
 */

export interface CircleCropOptions {
  panX: number; // Offset X in px
  panY: number; // Offset Y in px
  zoom: number; // Scale 1.0 to 3.0
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  targetSize: number; // Output dimension in px (e.g. 500 for 500x500)
  borderWidth: number; // 0 to 20 px
  borderColor: string; // Hex color e.g. '#ffffff'
  format: 'image/png' | 'image/webp' | 'image/jpeg';
  quality: number; // 0.1 to 1.0
  bgColor?: string; // For JPG fallback, e.g. '#ffffff'
}

export interface CircleCropResult {
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
 * Crops an image into a clean circular mask with transparent alpha corners.
 */
export async function cropImageToCircle(
  file: File,
  options: CircleCropOptions
): Promise<CircleCropResult> {
  const img = await loadImage(file);
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  const targetSize = Math.max(16, Math.min(8000, Math.round(options.targetSize)));
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas 2D context not supported.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const center = targetSize / 2;
  const radius = targetSize / 2;

  // Solid background if JPEG
  if (options.format === 'image/jpeg') {
    ctx.fillStyle = options.bgColor || '#ffffff';
    ctx.fillRect(0, 0, targetSize, targetSize);
  } else {
    ctx.clearRect(0, 0, targetSize, targetSize);
  }

  // Base fit scale to cover circle viewport
  const baseScale = Math.max(targetSize / origW, targetSize / origH);
  const totalScale = baseScale * (options.zoom || 1.0);

  // Scaled dimensions
  const drawW = origW * totalScale;
  const drawH = origH * totalScale;

  // Clip circular mask
  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();

  // Apply Pan, Rotation, Flip transformations centered on canvas
  ctx.translate(center + options.panX * (targetSize / 400), center + options.panY * (targetSize / 400));
  ctx.rotate((options.rotation * Math.PI) / 180);
  if (options.flipH) {
    ctx.scale(-1, 1);
  }

  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  // Draw optional decorative ring border
  if (options.borderWidth > 0) {
    const scaledBorder = Math.max(1, Math.round(options.borderWidth * (targetSize / 400)));
    ctx.save();
    ctx.strokeStyle = options.borderColor || '#ffffff';
    ctx.lineWidth = scaledBorder;
    ctx.beginPath();
    ctx.arc(center, center, radius - scaledBorder / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to generate circular image blob.'));
      },
      options.format,
      options.quality
    );
  });

  const dataUrl = canvas.toDataURL(options.format, options.quality);

  return {
    blob,
    dataUrl,
    width: targetSize,
    height: targetSize,
    fileSize: blob.size,
    fileSizeFormatted: formatBytes(blob.size),
    originalWidth: origW,
    originalHeight: origH,
  };
}

/**
 * 1-Click Interactive Test Sample Portrait Generator
 */
export async function generateSamplePortrait(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d')!;

  // Smooth warm portrait background gradient
  const grad = ctx.createLinearGradient(0, 0, 800, 1000);
  grad.addColorStop(0, '#4f46e5');
  grad.addColorStop(0.5, '#7c3aed');
  grad.addColorStop(1, '#db2777');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 1000);

  // Decorative avatar silhouette
  ctx.fillStyle = '#ffffff';
  // Head
  ctx.beginPath();
  ctx.arc(400, 380, 140, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders
  ctx.beginPath();
  ctx.ellipse(400, 720, 260, 180, 0, 0, Math.PI * 2);
  ctx.fill();

  // Text details
  ctx.fillStyle = '#312e81';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Sample Portrait', 400, 390);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('800 × 1000 px • Test Circle Cropper', 400, 940);

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/png')
  );
  return new File([blob], 'sample-avatar-portrait.png', { type: 'image/png' });
}
