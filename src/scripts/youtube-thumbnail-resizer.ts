/**
 * YouTube Thumbnail Resizer Client Engine
 * 100% Client-Side 16:9 Canvas Processing with High Fidelity
 */

export interface YouTubeThumbnailOptions {
  mode: 'fit' | 'fill'; // fit = entire photo + background; fill = 16:9 cropped
  bgType: 'blur' | 'solid';
  bgColor: string;
  blurStrength: number; // 5 to 50
  bgDim: number; // 0 to 50% darkness overlay
  zoom: number; // 0.5 to 3.0
  offsetX: number; // -1.5 to 1.5
  offsetY: number; // -1.5 to 1.5
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  targetWidth: number; // 1280, 1920, 640
  targetHeight: number; // 720, 1080, 360
  showSafeZone: boolean; // Bottom-right timestamp safe zone overlay
}

export interface LoadedImageInfo {
  img: HTMLImageElement;
  name: string;
  originalWidth: number;
  originalHeight: number;
  fileSize: number;
}

export const DEFAULT_YT_THUMBNAIL_OPTIONS: YouTubeThumbnailOptions = {
  mode: 'fit',
  bgType: 'blur',
  bgColor: '#0f172a',
  blurStrength: 25,
  bgDim: 15,
  zoom: 1.0,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  flipH: false,
  targetWidth: 1280,
  targetHeight: 720,
  showSafeZone: true,
};

export const YT_THUMBNAIL_PRESETS: Record<string, Partial<YouTubeThumbnailOptions>> = {
  fullBlur: {
    mode: 'fit',
    bgType: 'blur',
    blurStrength: 25,
    bgDim: 15,
    zoom: 1.0,
    offsetX: 0,
    offsetY: 0,
  },
  sixteenNineCrop: {
    mode: 'fill',
    zoom: 1.0,
    offsetX: 0,
    offsetY: 0,
  },
  cleanWhite: {
    mode: 'fit',
    bgType: 'solid',
    bgColor: '#ffffff',
    zoom: 1.0,
    offsetX: 0,
    offsetY: 0,
  },
  darkStudio: {
    mode: 'fit',
    bgType: 'solid',
    bgColor: '#0f172a',
    zoom: 1.0,
    offsetX: 0,
    offsetY: 0,
  },
  youtubeRed: {
    mode: 'fit',
    bgType: 'solid',
    bgColor: '#FF0000',
    zoom: 1.0,
    offsetX: 0,
    offsetY: 0,
  },
};

/**
 * Loads an image file into an HTMLImageElement
 */
export async function loadYouTubeThumbnailFromFile(file: File): Promise<LoadedImageInfo> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Invalid file type. Please upload an image file (JPG, PNG, WebP, AVIF, BMP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image.'));
      img.onload = () => {
        resolve({
          img,
          name: file.name,
          originalWidth: img.naturalWidth || img.width,
          originalHeight: img.naturalHeight || img.height,
          fileSize: file.size,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Renders the composed 16:9 YouTube Thumbnail onto an offscreen canvas
 */
export function renderYouTubeThumbnailCanvas(
  img: HTMLImageElement,
  options: YouTubeThumbnailOptions,
  customWidth?: number,
  customHeight?: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const targetW = customWidth || options.targetWidth || 1280;
  const targetH = customHeight || options.targetHeight || 720;

  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  // 1. Render Background if in 'fit' mode
  if (options.mode === 'fit') {
    if (options.bgType === 'blur') {
      ctx.save();
      const blurPx = Math.max(4, (options.blurStrength * (targetW / 1280)));
      ctx.filter = `blur(${blurPx}px)`;

      // Scale up to cover canvas with extra bleed margin to prevent edge fading
      const bgScale = Math.max(targetW / origW, targetH / origH) * 1.18;
      const bgW = origW * bgScale;
      const bgH = origH * bgScale;
      const bgX = (targetW - bgW) / 2;
      const bgY = (targetH - bgH) / 2;

      ctx.drawImage(img, bgX, bgY, bgW, bgH);
      ctx.restore();

      // Ambient darkening overlay for contrast
      if (options.bgDim > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${options.bgDim / 100})`;
        ctx.fillRect(0, 0, targetW, targetH);
      }
    } else {
      ctx.fillStyle = options.bgColor;
      ctx.fillRect(0, 0, targetW, targetH);
    }
  } else {
    // Fill mode: clean background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, targetW, targetH);
  }

  // 2. Compute Main Subject Placement
  ctx.save();

  const centerX = targetW / 2 + (options.offsetX * targetW) / 2;
  const centerY = targetH / 2 + (options.offsetY * targetH) / 2;

  ctx.translate(centerX, centerY);

  // Rotation
  if (options.rotation !== 0) {
    ctx.rotate((options.rotation * Math.PI) / 180);
  }

  // Horizontal Flip
  if (options.flipH) {
    ctx.scale(-1, 1);
  }

  // Base scale calculation
  let baseScale = 1.0;
  if (options.mode === 'fit') {
    baseScale = Math.min(targetW / origW, targetH / origH);
  } else {
    baseScale = Math.max(targetW / origW, targetH / origH);
  }

  const finalScale = baseScale * options.zoom;
  const drawW = origW * finalScale;
  const drawH = origH * finalScale;

  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  return canvas;
}

/**
 * Updates a target canvas with a scaled representation of the source thumbnail
 */
export function renderThumbnailPreview(sourceCanvas: HTMLCanvasElement, targetCanvas: HTMLCanvasElement, width: number = 320, height: number = 180): void {
  targetCanvas.width = width;
  targetCanvas.height = height;

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, width, height);
}

/**
 * Generates an instant high-quality demo creator thumbnail for 1-click preview
 */
export async function generateSampleYouTubeThumbnail(): Promise<LoadedImageInfo> {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // 1. High energy background gradient (Deep Navy to Royal Purple to Electric Cyan)
  const grad = ctx.createLinearGradient(0, 0, 1280, 720);
  grad.addColorStop(0, '#090d16');
  grad.addColorStop(0.5, '#1e1b4b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);

  // 2. Dynamic glowing neon streaks & bokeh
  const glowGrad = ctx.createRadialGradient(1050, 240, 20, 1050, 240, 380);
  glowGrad.addColorStop(0, 'rgba(236, 72, 153, 0.45)');
  glowGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.25)');
  glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, 1280, 720);

  const leftGlow = ctx.createRadialGradient(250, 550, 10, 250, 550, 300);
  leftGlow.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
  leftGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = leftGlow;
  ctx.fillRect(0, 0, 1280, 720);

  // 3. Creator Silhouette avatar / Subject on Right Side
  ctx.save();
  ctx.fillStyle = '#ffffff';

  // Head
  ctx.beginPath();
  ctx.arc(960, 310, 130, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders
  ctx.beginPath();
  ctx.ellipse(960, 660, 250, 180, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stylish expressive face details / glasses
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.strokeRect(875, 280, 70, 50);
  ctx.strokeRect(975, 280, 70, 50);
  ctx.beginPath();
  ctx.moveTo(945, 305);
  ctx.lineTo(975, 305);
  ctx.stroke();

  // Big excited smile
  ctx.beginPath();
  ctx.arc(960, 360, 35, 0.15 * Math.PI, 0.85 * Math.PI, false);
  ctx.stroke();
  ctx.restore();

  // 4. Bold Catchy Typography Mockup on Left Side
  // Badge Pill "100% PRO"
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.roundRect(80, 140, 220, 54, 12);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px Inter, sans-serif';
  ctx.fillText('⚡ YOUTUBE HD', 105, 176);

  // Big Headline: "MAKE PERFECT"
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 68px Inter, sans-serif';
  ctx.fillText('MAKE PERFECT', 80, 280);

  // Second Headline: "THUMBNAILS" with Yellow Pop
  ctx.fillStyle = '#FACC15';
  ctx.font = '900 78px Inter, sans-serif';
  ctx.fillText('THUMBNAILS', 80, 370);

  // Subtitle: "1280 × 720 HD"
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 32px Inter, sans-serif';
  ctx.fillText('IN SECONDS • 16:9 RATIO', 80, 435);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const img = new Image();
  await new Promise((res) => {
    img.onload = res;
    img.src = dataUrl;
  });

  return {
    img,
    name: 'sample-youtube-thumbnail.jpg',
    originalWidth: 1280,
    originalHeight: 720,
    fileSize: 220 * 1024,
  };
}

/**
 * Triggers browser download of canvas as JPG, WebP, or PNG
 */
export function exportYouTubeThumbnail(
  canvas: HTMLCanvasElement,
  format: 'image/jpeg' | 'image/png' | 'image/webp',
  quality: number,
  baseFilename: string = 'youtube-thumbnail'
): void {
  const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
  const dataUrl = canvas.toDataURL(format, format === 'image/png' ? undefined : quality);

  const link = document.createElement('a');
  link.download = `${baseFilename}-${canvas.width}x${canvas.height}.${ext}`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copies the current rendered canvas to system clipboard as PNG
 */
export async function copyYouTubeThumbnailToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  if (!navigator.clipboard || !window.ClipboardItem) {
    return false;
  }
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        resolve(true);
      } catch (err) {
        resolve(false);
      }
    }, 'image/png');
  });
}
