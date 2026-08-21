/**
 * Image Mosaic Engine
 * 100% Client-side canvas rendering for Photo Grid Mosaics,
 * Master Photo-in-Photo Mosaics, and Artistic Geometric Tile Mosaics.
 */

export type MosaicMode = 'grid' | 'master' | 'artistic';
export type ArtisticShape = 'square' | 'circle' | 'hexagon' | 'diamond' | 'brick';
export type AspectRatioType = '1:1' | '4:3' | '16:9' | '9:16' | '3:2' | 'auto';
export type ExportFormat = 'image/png' | 'image/webp' | 'image/jpeg';

export interface GridMosaicOptions {
  columns: number;
  rows?: number; // if undefined, computed from image count and columns
  gap: number;
  padding: number;
  cornerRadius: number;
  borderWidth: number;
  borderColor: string;
  backgroundColor: string;
  targetWidth: number;
  targetHeight: number;
  fitMode: 'cover' | 'contain';
}

export interface MasterMosaicOptions {
  tileCountX: number; // e.g. 20 to 50
  tileGap: number;
  tintOpacity: number; // 0 to 100% color tint overlay
  backgroundColor: string;
  tileShape: ArtisticShape;
}

export interface ArtisticMosaicOptions {
  tileSize: number; // e.g. 8 to 50 px
  tileGap: number;
  tileShape: ArtisticShape;
  cornerRadius: number;
  backgroundColor: string;
  colorBoost: number; // 0 to 50%
}

export interface LoadedImageItem {
  id: string;
  file?: File;
  img: HTMLImageElement;
  name: string;
  width: number;
  height: number;
  avgColor?: [number, number, number];
}

/**
 * Load an image from a File into an HTMLImageElement
 */
export function loadImageFromFile(file: File): Promise<LoadedImageItem> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const item: LoadedImageItem = {
          id: 'img_' + Math.random().toString(36).substring(2, 9),
          file,
          img,
          name: file.name,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        };
        item.avgColor = computeAverageColor(img);
        resolve(item);
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/**
 * Compute the average RGB color of an image
 */
export function computeAverageColor(img: CanvasImageSource, width = 40, height = 40): [number, number, number] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [128, 128, 128];

  ctx.drawImage(img, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;
  let r = 0, g = 0, b = 0, count = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 30) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
  }

  if (count === 0) return [128, 128, 128];
  return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
}

/**
 * Draw a rounded rectangle path onto canvas
 */
function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Draw a regular polygon (like a hexagon)
 */
function drawHexagonPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/**
 * Draw a diamond shape path
 */
function drawDiamondPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number
) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - h / 2);
  ctx.lineTo(cx + w / 2, cy);
  ctx.lineTo(cx, cy + h / 2);
  ctx.lineTo(cx - w / 2, cy);
  ctx.closePath();
}

/**
 * 1. RENDER PHOTO GRID MOSAIC
 * Arranges an array of images into an M x N grid with spacing, borders, and rounding.
 */
export function renderGridMosaic(
  canvas: HTMLCanvasElement,
  images: LoadedImageItem[],
  options: GridMosaicOptions
): void {
  if (!images || images.length === 0) {
    canvas.width = options.targetWidth || 1200;
    canvas.height = options.targetHeight || 1200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = options.backgroundColor || '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    return;
  }

  const cols = Math.max(1, options.columns || 3);
  const rows = options.rows || Math.ceil(images.length / cols);
  const totalSlots = cols * rows;

  const width = options.targetWidth || 1200;
  const height = options.targetHeight || 1200;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  // Background
  if (options.backgroundColor === 'transparent') {
    ctx.clearRect(0, 0, width, height);
  } else {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  const pad = options.padding;
  const gap = options.gap;

  const availableW = width - pad * 2 - gap * (cols - 1);
  const availableH = height - pad * 2 - gap * (rows - 1);

  const cellW = Math.max(1, availableW / cols);
  const cellH = Math.max(1, availableH / rows);

  for (let idx = 0; idx < totalSlots; idx++) {
    const c = idx % cols;
    const r = Math.floor(idx / cols);

    const cellX = pad + c * (cellW + gap);
    const cellY = pad + r * (cellH + gap);

    // Get image (wrap around if fewer images than slots)
    const imgItem = images[idx % images.length];
    const img = imgItem.img;

    ctx.save();

    // Clip to rounded rect if radius > 0
    if (options.cornerRadius > 0) {
      drawRoundedRectPath(ctx, cellX, cellY, cellW, cellH, options.cornerRadius);
      ctx.clip();
    }

    // Draw Image with Fit Mode
    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;

    if (options.fitMode === 'cover') {
      const imgRatio = imgW / imgH;
      const cellRatio = cellW / cellH;

      let drawW = cellW;
      let drawH = cellH;
      let drawX = cellX;
      let drawY = cellY;

      if (imgRatio > cellRatio) {
        drawW = cellH * imgRatio;
        drawX = cellX + (cellW - drawW) / 2;
      } else {
        drawH = cellW / imgRatio;
        drawY = cellY + (cellH - drawH) / 2;
      }
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    } else {
      // Contain mode (centered)
      const scale = Math.min(cellW / imgW, cellH / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const drawX = cellX + (cellW - drawW) / 2;
      const drawY = cellY + (cellH - drawH) / 2;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }

    ctx.restore();

    // Draw border if requested
    if (options.borderWidth > 0 && options.borderColor) {
      ctx.save();
      ctx.lineWidth = options.borderWidth;
      ctx.strokeStyle = options.borderColor;
      if (options.cornerRadius > 0) {
        drawRoundedRectPath(ctx, cellX, cellY, cellW, cellH, options.cornerRadius);
        ctx.stroke();
      } else {
        ctx.strokeRect(cellX, cellY, cellW, cellH);
      }
      ctx.restore();
    }
  }
}

/**
 * 2. RENDER MASTER PHOTO-IN-PHOTO MOSAIC
 * Reconstructs a master image using a pool of thumbnail photos with color tinting.
 */
export function renderMasterPhotoMosaic(
  canvas: HTMLCanvasElement,
  masterImg: HTMLImageElement,
  tileImages: LoadedImageItem[],
  options: MasterMosaicOptions
): void {
  const masterW = masterImg.naturalWidth || masterImg.width;
  const masterH = masterImg.naturalHeight || masterImg.height;

  canvas.width = masterW;
  canvas.height = masterH;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  // Background
  if (options.backgroundColor === 'transparent') {
    ctx.clearRect(0, 0, masterW, masterH);
  } else {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, masterW, masterH);
  }

  // Create an offscreen canvas to sample colors from the master image
  const sampleCols = Math.max(8, Math.min(100, options.tileCountX || 30));
  const tileAspect = masterW / masterH;
  const sampleRows = Math.max(8, Math.round(sampleCols / tileAspect));

  const offscreen = document.createElement('canvas');
  offscreen.width = sampleCols;
  offscreen.height = sampleRows;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return;

  offCtx.drawImage(masterImg, 0, 0, sampleCols, sampleRows);
  const pixelData = offCtx.getImageData(0, 0, sampleCols, sampleRows).data;

  const tileW = masterW / sampleCols;
  const tileH = masterH / sampleRows;
  const gap = options.tileGap;
  const usableTileW = Math.max(1, tileW - gap);
  const usableTileH = Math.max(1, tileH - gap);

  const hasTiles = tileImages && tileImages.length > 0;

  for (let r = 0; r < sampleRows; r++) {
    for (let c = 0; c < sampleCols; c++) {
      const idx = (r * sampleCols + c) * 4;
      const red = pixelData[idx];
      const green = pixelData[idx + 1];
      const blue = pixelData[idx + 2];
      const alpha = pixelData[idx + 3] / 255;

      if (alpha < 0.1) continue;

      const posX = c * tileW + gap / 2;
      const posY = r * tileH + gap / 2;

      ctx.save();

      // Shape clipping
      if (options.tileShape === 'circle') {
        const cx = posX + usableTileW / 2;
        const cy = posY + usableTileH / 2;
        const rad = Math.min(usableTileW, usableTileH) / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.clip();
      } else if (options.tileShape === 'hexagon') {
        const cx = posX + usableTileW / 2;
        const cy = posY + usableTileH / 2;
        const rad = Math.min(usableTileW, usableTileH) / 2;
        drawHexagonPath(ctx, cx, cy, rad);
        ctx.clip();
      } else if (options.tileShape === 'diamond') {
        const cx = posX + usableTileW / 2;
        const cy = posY + usableTileH / 2;
        drawDiamondPath(ctx, cx, cy, usableTileW, usableTileH);
        ctx.clip();
      }

      if (hasTiles) {
        // Find best matching tile or rotate
        const tileIdx = (r * sampleCols + c) % tileImages.length;
        const tileItem = tileImages[tileIdx];
        const tImg = tileItem.img;

        // Draw tile image covering slot
        ctx.drawImage(tImg, posX, posY, usableTileW, usableTileH);

        // Blend Master color tint over tile
        if (options.tintOpacity > 0) {
          ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${options.tintOpacity / 100})`;
          ctx.fillRect(posX, posY, usableTileW, usableTileH);
        }
      } else {
        // Solid colored tile block
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.fillRect(posX, posY, usableTileW, usableTileH);
      }

      ctx.restore();
    }
  }
}

/**
 * 3. RENDER ARTISTIC GEOMETRIC TILE MOSAIC
 * Converts a single source image into a geometric mosaic (square, circle, hexagon, diamond, brick).
 */
export function renderArtisticTileMosaic(
  canvas: HTMLCanvasElement,
  sourceImg: HTMLImageElement,
  options: ArtisticMosaicOptions
): void {
  const width = sourceImg.naturalWidth || sourceImg.width;
  const height = sourceImg.naturalHeight || sourceImg.height;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  // Background
  if (options.backgroundColor === 'transparent') {
    ctx.clearRect(0, 0, width, height);
  } else {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  // Draw source image to sample colors
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return;

  offCtx.drawImage(sourceImg, 0, 0, width, height);
  const fullData = offCtx.getImageData(0, 0, width, height).data;

  const size = Math.max(4, options.tileSize || 16);
  const gap = options.tileGap || 0;
  const step = size + gap;

  const cols = Math.ceil(width / step);
  const rows = Math.ceil(height / step);

  for (let r = 0; r < rows; r++) {
    const isOddRow = r % 2 === 1;
    const xOffset = options.tileShape === 'brick' && isOddRow ? size / 2 : 0;

    for (let c = 0; c < cols + 1; c++) {
      const tileX = c * step - xOffset;
      const tileY = r * step;

      // Sample center pixel of tile block
      const sampleX = Math.min(width - 1, Math.max(0, Math.floor(tileX + size / 2)));
      const sampleY = Math.min(height - 1, Math.max(0, Math.floor(tileY + size / 2)));
      const pixelIdx = (sampleY * width + sampleX) * 4;

      let red = fullData[pixelIdx];
      let green = fullData[pixelIdx + 1];
      let blue = fullData[pixelIdx + 2];
      const alpha = fullData[pixelIdx + 3] / 255;

      if (alpha < 0.05) continue;

      // Optional slight color saturation boost
      if (options.colorBoost > 0) {
        const boost = 1 + options.colorBoost / 100;
        const avg = (red + green + blue) / 3;
        red = Math.min(255, Math.max(0, Math.round(avg + (red - avg) * boost)));
        green = Math.min(255, Math.max(0, Math.round(avg + (green - avg) * boost)));
        blue = Math.min(255, Math.max(0, Math.round(avg + (blue - avg) * boost)));
      }

      ctx.save();
      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;

      const shape = options.tileShape;

      if (shape === 'circle') {
        const cx = tileX + size / 2;
        const cy = tileY + size / 2;
        const radius = size / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (shape === 'hexagon') {
        const cx = tileX + size / 2;
        const cy = tileY + size / 2;
        const radius = size / 2;
        drawHexagonPath(ctx, cx, cy, radius);
        ctx.fill();
      } else if (shape === 'diamond') {
        const cx = tileX + size / 2;
        const cy = tileY + size / 2;
        drawDiamondPath(ctx, cx, cy, size, size);
        ctx.fill();
      } else {
        // Square or Brick
        if (options.cornerRadius > 0) {
          drawRoundedRectPath(ctx, tileX, tileY, size, size, options.cornerRadius);
          ctx.fill();
        } else {
          ctx.fillRect(tileX, tileY, size, size);
        }
      }

      ctx.restore();
    }
  }
}

/**
 * Generate 6 vibrant sample demo images via Canvas for 1-click preview
 */
export function generateSampleDemoImages(): Promise<LoadedImageItem[]> {
  const demos = [
    { title: 'Sunset Gradient', g1: '#f97316', g2: '#ec4899', icon: '🌅' },
    { title: 'Ocean Waves', g1: '#06b6d4', g2: '#3b82f6', icon: '🌊' },
    { title: 'Emerald Forest', g1: '#10b981', g2: '#047857', icon: '🌲' },
    { title: 'Neon Cyber', g1: '#8b5cf6', g2: '#d946ef', icon: '⚡' },
    { title: 'Golden Desert', g1: '#eab308', g2: '#ea580c', icon: '🏜️' },
    { title: 'Midnight Sky', g1: '#1e293b', g2: '#4338ca', icon: '🌌' },
    { title: 'Coral Reef', g1: '#f43f5e', g2: '#fb923c', icon: '🪸' },
    { title: 'Aurora Borealis', g1: '#14b8a6', g2: '#6366f1', icon: '✨' },
    { title: 'Rose Garden', g1: '#f472b6', g2: '#e11d48', icon: '🌹' },
  ];

  return Promise.all(
    demos.map((d, index) => {
      return new Promise<LoadedImageItem>((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d')!;

        // Linear Gradient
        const grad = ctx.createLinearGradient(0, 0, 400, 400);
        grad.addColorStop(0, d.g1);
        grad.addColorStop(1, d.g2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 400);

        // Circular background accent
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(200, 200, 120, 0, Math.PI * 2);
        ctx.fill();

        // Emoji / Symbol
        ctx.font = '64px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.icon, 200, 180);

        // Title text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(d.title, 200, 260);

        const img = new Image();
        img.onload = () => {
          resolve({
            id: `demo_${index + 1}`,
            img,
            name: `${d.title.toLowerCase().replace(/\s+/g, '-')}.png`,
            width: 400,
            height: 400,
            avgColor: computeAverageColor(img),
          });
        };
        img.src = canvas.toDataURL('image/png');
      });
    })
  );
}

/**
 * Export canvas to Blob or Data URL for download
 */
export async function exportMosaicImage(
  canvas: HTMLCanvasElement,
  format: ExportFormat = 'image/png',
  quality = 0.92,
  filename = 'imgfeel-mosaic'
): Promise<void> {
  const mimeType = format;
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
      mimeType,
      quality
    );
  } else {
    const dataUrl = canvas.toDataURL(mimeType, quality);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fullFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Copy mosaic canvas to system clipboard as image/png
 */
export async function copyMosaicToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
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
