/**
 * Client-Side Image Stitching Engine
 * 100% In-Browser Privacy • Merge & Combine Multiple Images Horizontally, Vertically, or in a Grid
 */

export type StitchDirection = 'horizontal' | 'vertical' | 'grid2' | 'grid3';
export type SizingMode = 'match' | 'original';
export type AlignmentMode = 'start' | 'center' | 'end';

export interface StitchImageItem {
  id: string;
  file: File;
  img: HTMLImageElement;
  name: string;
  originalWidth: number;
  originalHeight: number;
  previewUrl: string;
}

export interface StitchOptions {
  direction: StitchDirection;
  sizing: SizingMode;
  alignment: AlignmentMode;
  gap: number; // Spacing between images (px)
  padding: number; // Outer canvas border margin (px)
  radius: number; // Corner radius for individual images (px)
  backgroundColor: string; // 'transparent' or hex color e.g. '#ffffff'
  format: 'image/jpeg' | 'image/png' | 'image/webp' | 'original';
  quality: number; // 0.1 to 1.0
}

export interface StitchResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  fileSize: number;
  fileSizeFormatted: string;
  imageCount: number;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}

/**
 * Calculates layout positions, scaled dimensions, and total canvas size.
 */
export function calculateStitchLayout(
  items: StitchImageItem[],
  options: StitchOptions
): {
  canvasWidth: number;
  canvasHeight: number;
  positions: Array<{ x: number; y: number; width: number; height: number; img: HTMLImageElement }>;
} {
  if (items.length === 0) {
    return { canvasWidth: 0, canvasHeight: 0, positions: [] };
  }

  const { direction, sizing, alignment, gap, padding } = options;

  // Single image edge case
  if (items.length === 1) {
    const item = items[0];
    const w = item.originalWidth;
    const h = item.originalHeight;
    return {
      canvasWidth: w + padding * 2,
      canvasHeight: h + padding * 2,
      positions: [{ x: padding, y: padding, width: w, height: h, img: item.img }],
    };
  }

  if (direction === 'horizontal') {
    // Determine common height if sizing === 'match'
    let targetHeight = 0;
    if (sizing === 'match') {
      // Find average or median height, or first image height
      const heights = items.map((i) => i.originalHeight);
      targetHeight = Math.round(heights.reduce((a, b) => a + b, 0) / heights.length);
    } else {
      targetHeight = Math.max(...items.map((i) => i.originalHeight));
    }

    const scaledItems = items.map((item) => {
      if (sizing === 'match') {
        const scale = targetHeight / item.originalHeight;
        const w = Math.round(item.originalWidth * scale);
        return { width: w, height: targetHeight, img: item.img };
      } else {
        return { width: item.originalWidth, height: item.originalHeight, img: item.img };
      }
    });

    const totalImagesWidth = scaledItems.reduce((acc, curr) => acc + curr.width, 0);
    const totalGapsWidth = (scaledItems.length - 1) * gap;
    const canvasWidth = totalImagesWidth + totalGapsWidth + padding * 2;
    const canvasHeight = targetHeight + padding * 2;

    let currentX = padding;
    const positions = scaledItems.map((item) => {
      let y = padding;
      if (sizing === 'original') {
        if (alignment === 'center') {
          y = padding + (targetHeight - item.height) / 2;
        } else if (alignment === 'end') {
          y = padding + (targetHeight - item.height);
        }
      }
      const pos = { x: currentX, y, width: item.width, height: item.height, img: item.img };
      currentX += item.width + gap;
      return pos;
    });

    return { canvasWidth, canvasHeight, positions };
  }

  if (direction === 'vertical') {
    // Determine common width if sizing === 'match'
    let targetWidth = 0;
    if (sizing === 'match') {
      const widths = items.map((i) => i.originalWidth);
      targetWidth = Math.round(widths.reduce((a, b) => a + b, 0) / widths.length);
    } else {
      targetWidth = Math.max(...items.map((i) => i.originalWidth));
    }

    const scaledItems = items.map((item) => {
      if (sizing === 'match') {
        const scale = targetWidth / item.originalWidth;
        const h = Math.round(item.originalHeight * scale);
        return { width: targetWidth, height: h, img: item.img };
      } else {
        return { width: item.originalWidth, height: item.originalHeight, img: item.img };
      }
    });

    const totalImagesHeight = scaledItems.reduce((acc, curr) => acc + curr.height, 0);
    const totalGapsHeight = (scaledItems.length - 1) * gap;
    const canvasWidth = targetWidth + padding * 2;
    const canvasHeight = totalImagesHeight + totalGapsHeight + padding * 2;

    let currentY = padding;
    const positions = scaledItems.map((item) => {
      let x = padding;
      if (sizing === 'original') {
        if (alignment === 'center') {
          x = padding + (targetWidth - item.width) / 2;
        } else if (alignment === 'end') {
          x = padding + (targetWidth - item.width);
        }
      }
      const pos = { x, y: currentY, width: item.width, height: item.height, img: item.img };
      currentY += item.height + gap;
      return pos;
    });

    return { canvasWidth, canvasHeight, positions };
  }

  // Grid layout (grid2 = 2 columns, grid3 = 3 columns)
  const cols = direction === 'grid3' ? 3 : 2;
  const numRows = Math.ceil(items.length / cols);

  // Standardize cell column width
  const baseWidths = items.map((i) => i.originalWidth);
  const targetColWidth = Math.round(baseWidths.reduce((a, b) => a + b, 0) / baseWidths.length);

  // Scale all items to target column width
  const scaledItems = items.map((item) => {
    const scale = targetColWidth / item.originalWidth;
    const h = Math.round(item.originalHeight * scale);
    return { width: targetColWidth, height: h, img: item.img };
  });

  // Calculate row heights
  const rowHeights: number[] = [];
  for (let r = 0; r < numRows; r++) {
    let maxHInRow = 0;
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (idx < scaledItems.length) {
        maxHInRow = Math.max(maxHInRow, scaledItems[idx].height);
      }
    }
    rowHeights.push(maxHInRow);
  }

  const totalGridWidth = cols * targetColWidth + (cols - 1) * gap;
  const totalGridHeight = rowHeights.reduce((a, b) => a + b, 0) + (numRows - 1) * gap;

  const canvasWidth = totalGridWidth + padding * 2;
  const canvasHeight = totalGridHeight + padding * 2;

  const positions: Array<{ x: number; y: number; width: number; height: number; img: HTMLImageElement }> = [];

  let startY = padding;
  for (let r = 0; r < numRows; r++) {
    const rowH = rowHeights[r];
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (idx < scaledItems.length) {
        const item = scaledItems[idx];
        const x = padding + c * (targetColWidth + gap);
        let y = startY;
        if (alignment === 'center') {
          y = startY + (rowH - item.height) / 2;
        } else if (alignment === 'end') {
          y = startY + (rowH - item.height);
        }
        positions.push({ x, y, width: item.width, height: item.height, img: item.img });
      }
    }
    startY += rowH + gap;
  }

  return { canvasWidth, canvasHeight, positions };
}

/**
 * Renders the stitched image directly onto a target canvas.
 */
export function renderStitchedCanvas(
  items: StitchImageItem[],
  targetCanvas: HTMLCanvasElement,
  options: StitchOptions
): void {
  if (items.length === 0) return;

  const layout = calculateStitchLayout(items, options);
  targetCanvas.width = layout.canvasWidth;
  targetCanvas.height = layout.canvasHeight;

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, layout.canvasWidth, layout.canvasHeight);

  // Background fill
  if (options.backgroundColor && options.backgroundColor !== 'transparent') {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, layout.canvasWidth, layout.canvasHeight);
  }

  const radius = Math.max(0, options.radius);

  layout.positions.forEach((pos) => {
    ctx.save();
    if (radius > 0) {
      ctx.beginPath();
      ctx.roundRect(pos.x, pos.y, pos.width, pos.height, radius);
      ctx.clip();
    }
    ctx.drawImage(pos.img, pos.x, pos.y, pos.width, pos.height);
    ctx.restore();
  });
}

/**
 * Exports stitched image items into a downloadable file result.
 */
export async function exportStitchedImage(
  items: StitchImageItem[],
  options: StitchOptions
): Promise<StitchResult> {
  const canvas = document.createElement('canvas');
  renderStitchedCanvas(items, canvas, options);

  let exportMime = options.format;
  if (exportMime === 'original') {
    const hasTransparentBg = !options.backgroundColor || options.backgroundColor === 'transparent';
    const anyPng = items.some((i) => i.file.type === 'image/png' || i.file.type === 'image/webp');
    exportMime = hasTransparentBg || anyPng ? 'image/png' : 'image/jpeg';
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to generate stitched image blob.'));
      },
      exportMime,
      options.quality
    );
  });

  const dataUrl = canvas.toDataURL(exportMime, options.quality);

  return {
    blob,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    fileSize: blob.size,
    fileSizeFormatted: formatBytes(blob.size),
    imageCount: items.length,
  };
}

/**
 * Generates 3 coordinated sample images in-browser to immediately test stitching.
 */
export async function generateSampleStitchImages(): Promise<File[]> {
  const samples = [
    { title: 'PANORAMA 1: MOUNTAIN PEAK', bg: ['#0f172a', '#1e3a8a', '#3b82f6'], tag: 'NATURE' },
    { title: 'PANORAMA 2: GOLDEN SUNSET', bg: ['#312e81', '#9333ea', '#f59e0b'], tag: 'SUNSET' },
    { title: 'PANORAMA 3: OCEAN HORIZON', bg: ['#042f2e', '#0d9488', '#38bdf8'], tag: 'COASTAL' },
  ];

  const files: File[] = [];

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 600, 400);
    grad.addColorStop(0, s.bg[0]);
    grad.addColorStop(0.5, s.bg[1]);
    grad.addColorStop(1, s.bg[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 400);

    // Decorative geometric sun & waves
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(300, 180, 80 + i * 15, 0, Math.PI * 2);
    ctx.fill();

    // Text Badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.roundRect(40, 280, 520, 80, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.title, 300, 318);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '13px monospace';
    ctx.fillText(`IMGFEEL STITCH SAMPLE #${i + 1} • ${s.tag}`, 300, 345);

    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
    files.push(new File([blob], `sample-panel-${i + 1}.png`, { type: 'image/png' }));
  }

  return files;
}
