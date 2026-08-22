/**
 * Facebook Cover Photo Resizer Client Engine
 * 100% Client-Side Canvas Processing with High Fidelity
 */

export interface FacebookCoverOptions {
  mode: 'fit' | 'fill'; // fit = entire photo + background; fill = cover cropped
  bgType: 'blur' | 'solid';
  bgColor: string;
  blurStrength: number; // 5 to 50
  bgDim: number; // 0 to 50% darkness overlay
  zoom: number; // 0.5 to 3.0
  offsetX: number; // -1.5 to 1.5
  offsetY: number; // -1.5 to 1.5
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  coverType: 'pageMaster' | 'desktopStandard' | 'groupCover' | 'eventCover';
  targetWidth: number;
  targetHeight: number;
  showSafeZone: boolean;
}

export interface LoadedCoverInfo {
  img: HTMLImageElement;
  name: string;
  originalWidth: number;
  originalHeight: number;
  fileSize: number;
}

export const FB_COVER_DIMENSIONS = {
  pageMaster: { width: 1640, height: 720, label: 'Page / Profile Master (1640 × 720 px — Dual Safe Zone)' },
  desktopStandard: { width: 820, height: 312, label: 'Desktop Standard (820 × 312 px)' },
  groupCover: { width: 1640, height: 856, label: 'Group Cover (1640 × 856 px — 1.91:1)' },
  eventCover: { width: 1200, height: 628, label: 'Event Cover (1200 × 628 px — 1.91:1)' },
};

export const DEFAULT_FB_COVER_OPTIONS: FacebookCoverOptions = {
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
  coverType: 'pageMaster',
  targetWidth: 1640,
  targetHeight: 720,
  showSafeZone: true,
};

export const FB_COVER_PRESETS: Record<string, Partial<FacebookCoverOptions>> = {
  fullBlur: {
    mode: 'fit',
    bgType: 'blur',
    blurStrength: 25,
    bgDim: 15,
    zoom: 1.0,
    offsetX: 0,
    offsetY: 0,
  },
  coverCrop: {
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
  facebookBlue: {
    mode: 'fit',
    bgType: 'solid',
    bgColor: '#1877F2',
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
};

/**
 * Loads an image file into an HTMLImageElement
 */
export async function loadFacebookCoverFromFile(file: File): Promise<LoadedCoverInfo> {
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
 * Renders the composed Facebook Cover onto an offscreen canvas
 */
export function renderFacebookCoverCanvas(
  img: HTMLImageElement,
  options: FacebookCoverOptions,
  customWidth?: number,
  customHeight?: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const targetW = customWidth || options.targetWidth || 1640;
  const targetH = customHeight || options.targetHeight || 720;

  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  // 1. Background rendering
  if (options.mode === 'fit') {
    if (options.bgType === 'blur') {
      ctx.save();
      const blurPx = Math.max(4, (options.blurStrength * (targetW / 1640)));
      ctx.filter = `blur(${blurPx}px)`;

      // Bleed margin to prevent light edges
      const bgScale = Math.max(targetW / origW, targetH / origH) * 1.2;
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
    // Fill mode background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, targetW, targetH);
  }

  // 2. Main Subject Placement
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
 * Updates a target preview canvas with a scaled representation of the source cover
 */
export function renderFacebookCoverPreview(
  sourceCanvas: HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement,
  cropMode: 'full' | 'desktopCrop' | 'mobileCrop' = 'full'
): void {
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  const tw = targetCanvas.width;
  const th = targetCanvas.height;

  ctx.clearRect(0, 0, tw, th);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;

  if (cropMode === 'desktopCrop') {
    // Desktop crops top and bottom (~13% top, ~13% bottom on 1640x720)
    const cropTop = sh * 0.13;
    const cropHeight = sh * 0.74;
    ctx.drawImage(sourceCanvas, 0, cropTop, sw, cropHeight, 0, 0, tw, th);
  } else if (cropMode === 'mobileCrop') {
    // Mobile crops left and right (~14% left, ~14% right on 1640x720)
    const cropLeft = sw * 0.14;
    const cropWidth = sw * 0.72;
    ctx.drawImage(sourceCanvas, cropLeft, 0, cropWidth, sh, 0, 0, tw, th);
  } else {
    ctx.drawImage(sourceCanvas, 0, 0, sw, sh, 0, 0, tw, th);
  }
}

/**
 * Generates an instant high-quality demo Facebook cover for 1-click preview
 */
export async function generateSampleFacebookCover(): Promise<LoadedCoverInfo> {
  const canvas = document.createElement('canvas');
  canvas.width = 1640;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // 1. Sleek Modern Deep Navy to Electric Blue Gradient
  const grad = ctx.createLinearGradient(0, 0, 1640, 720);
  grad.addColorStop(0, '#0a0f1d');
  grad.addColorStop(0.45, '#1e293b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1640, 720);

  // 2. Facebook Blue Vibrant Glow on Right Side
  const glowGrad = ctx.createRadialGradient(1300, 360, 30, 1300, 360, 480);
  glowGrad.addColorStop(0, 'rgba(24, 119, 242, 0.45)');
  glowGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.2)');
  glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, 1640, 720);

  // 3. Central Creator Typography (Centered in Safe Zone)
  // Badge Pill "OFFICIAL PAGE"
  ctx.fillStyle = '#1877F2';
  ctx.beginPath();
  ctx.roundRect(500, 180, 260, 52, 12);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 22px Inter, sans-serif';
  ctx.fillText('★ OFFICIAL BRAND', 530, 215);

  // Main Headline
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 68px Inter, sans-serif';
  ctx.fillText('DESIGN & INNOVATION', 500, 310);

  // Subtitle
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 28px Inter, sans-serif';
  ctx.fillText('CREATIVE STUDIO • DIGITAL PRODUCTS • 2026', 500, 370);

  // Social handles / CTA
  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 24px Inter, sans-serif';
  ctx.fillText('fb.com/yourbrand • Join our 250k+ Community', 500, 430);

  // 4. Abstract Geometric / 3D Shape Accents on Right
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(1380, 360, 180, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#1877F2';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(1380, 360, 120, -0.2 * Math.PI, 1.2 * Math.PI);
  ctx.stroke();
  ctx.restore();

  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const img = new Image();
  await new Promise((res) => {
    img.onload = res;
    img.src = dataUrl;
  });

  return {
    img,
    name: 'sample-facebook-cover.jpg',
    originalWidth: 1640,
    originalHeight: 720,
    fileSize: 260 * 1024,
  };
}

/**
 * Triggers browser download of canvas as JPG, WebP, or PNG
 */
export function exportFacebookCover(
  canvas: HTMLCanvasElement,
  format: 'image/jpeg' | 'image/png' | 'image/webp',
  quality: number,
  baseFilename: string = 'facebook-cover'
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
export async function copyFacebookCoverToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
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
