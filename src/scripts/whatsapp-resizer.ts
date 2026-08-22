/**
 * WhatsApp Profile Picture Resizer Client Engine
 * 100% Client-Side Canvas Processing with High Fidelity
 */

export interface WhatsAppResizerOptions {
  mode: 'fit' | 'fill'; // fit = entire photo + background; fill = 1:1 cropped
  bgType: 'blur' | 'solid';
  bgColor: string;
  blurStrength: number; // 5 to 50
  bgDim: number; // 0 to 50% darkness overlay
  zoom: number; // 0.5 to 3.0
  offsetX: number; // -1.0 to 1.0
  offsetY: number; // -1.0 to 1.0
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  outputSize: number; // 500, 800, 1080, or 0 (original max)
}

export interface LoadedImageInfo {
  img: HTMLImageElement;
  name: string;
  originalWidth: number;
  originalHeight: number;
  fileSize: number;
}

export const DEFAULT_WA_OPTIONS: WhatsAppResizerOptions = {
  mode: 'fit',
  bgType: 'blur',
  bgColor: '#ffffff',
  blurStrength: 25,
  bgDim: 15,
  zoom: 1.0,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  flipH: false,
  outputSize: 800,
};

export const WA_PRESETS: Record<string, Partial<WhatsAppResizerOptions>> = {
  fullBlur: {
    mode: 'fit',
    bgType: 'blur',
    blurStrength: 25,
    bgDim: 15,
    zoom: 1.0,
    offsetX: 0,
    offsetY: 0,
  },
  squareFill: {
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
    bgColor: '#111827',
    zoom: 1.0,
    offsetX: 0,
    offsetY: 0,
  },
  whatsappGreen: {
    mode: 'fit',
    bgType: 'solid',
    bgColor: '#075E54',
    zoom: 1.0,
    offsetX: 0,
    offsetY: 0,
  },
};

/**
 * Loads an image file into an HTMLImageElement
 */
export async function loadWhatsAppImageFromFile(file: File): Promise<LoadedImageInfo> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Invalid file type. Please upload a valid image file.'));
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
 * Renders the composed square WhatsApp Profile Picture onto an offscreen canvas
 */
export function renderWhatsAppCanvas(
  img: HTMLImageElement,
  options: WhatsAppResizerOptions,
  customTargetSize?: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const targetDim = customTargetSize || (options.outputSize === 0 ? Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height) : options.outputSize);
  
  canvas.width = targetDim;
  canvas.height = targetDim;

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
      // Apply blur relative to target dimension
      const blurPx = Math.max(2, (options.blurStrength * (targetDim / 500)));
      ctx.filter = `blur(${blurPx}px)`;

      // Scale up to cover canvas with extra bleed margin to prevent edge fading
      const bgScale = Math.max(targetDim / origW, targetDim / origH) * 1.15;
      const bgW = origW * bgScale;
      const bgH = origH * bgScale;
      const bgX = (targetDim - bgW) / 2;
      const bgY = (targetDim - bgH) / 2;

      ctx.drawImage(img, bgX, bgY, bgW, bgH);
      ctx.restore();

      // Ambient darkening overlay for contrast
      if (options.bgDim > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${options.bgDim / 100})`;
        ctx.fillRect(0, 0, targetDim, targetDim);
      }
    } else {
      ctx.fillStyle = options.bgColor;
      ctx.fillRect(0, 0, targetDim, targetDim);
    }
  } else {
    // Fill mode: clean background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, targetDim, targetDim);
  }

  // 2. Compute Main Subject Placement
  ctx.save();

  // Move origin to center of canvas
  const centerX = targetDim / 2 + (options.offsetX * targetDim) / 2;
  const centerY = targetDim / 2 + (options.offsetY * targetDim) / 2;

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
    baseScale = Math.min(targetDim / origW, targetDim / origH);
  } else {
    baseScale = Math.max(targetDim / origW, targetDim / origH);
  }

  const finalScale = baseScale * options.zoom;
  const drawW = origW * finalScale;
  const drawH = origH * finalScale;

  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  return canvas;
}

/**
 * Updates a target canvas with a circular cropped representation of the source canvas
 */
export function renderCircularPreview(sourceCanvas: HTMLCanvasElement, targetCanvas: HTMLCanvasElement, previewDim: number = 180): void {
  targetCanvas.width = previewDim;
  targetCanvas.height = previewDim;

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, previewDim, previewDim);
  ctx.save();
  ctx.beginPath();
  ctx.arc(previewDim / 2, previewDim / 2, previewDim / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, previewDim, previewDim);
  ctx.restore();
}

/**
 * Generates an instant high-quality demo portrait for 1-click sample preview
 */
export async function generateSampleAvatar(): Promise<LoadedImageInfo> {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1200; // 3:4 portrait photo
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // Stylish portrait background gradient
  const grad = ctx.createLinearGradient(0, 0, 900, 1200);
  grad.addColorStop(0, '#f97316');
  grad.addColorStop(0.5, '#ec4899');
  grad.addColorStop(1, '#8b5cf6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 900, 1200);

  // Soft bokeh background circles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.arc(200, 250, 140, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(700, 380, 180, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(150, 900, 200, 0, Math.PI * 2);
  ctx.fill();

  // Head and torso silhouette avatar
  ctx.fillStyle = '#ffffff';

  // Head
  ctx.beginPath();
  ctx.arc(450, 480, 180, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders / Torso
  ctx.beginPath();
  ctx.ellipse(450, 950, 320, 220, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stylish glasses / face details
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';

  // Glasses left lens
  ctx.strokeRect(330, 440, 95, 65);
  // Glasses right lens
  ctx.strokeRect(475, 440, 95, 65);
  // Bridge
  ctx.beginPath();
  ctx.moveTo(425, 470);
  ctx.lineTo(475, 470);
  ctx.stroke();

  // Smile
  ctx.beginPath();
  ctx.arc(450, 540, 45, 0.2 * Math.PI, 0.8 * Math.PI, false);
  ctx.stroke();

  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const img = new Image();
  await new Promise((res) => {
    img.onload = res;
    img.src = dataUrl;
  });

  return {
    img,
    name: 'sample-portrait.jpg',
    originalWidth: 900,
    originalHeight: 1200,
    fileSize: 180 * 1024,
  };
}

/**
 * Triggers browser download of canvas as JPG, WebP, or PNG
 */
export function exportWhatsAppImage(
  canvas: HTMLCanvasElement,
  format: 'image/jpeg' | 'image/png' | 'image/webp',
  quality: number,
  baseFilename: string = 'whatsapp-dp'
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
export async function copyWhatsAppCanvasToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
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
