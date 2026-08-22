/**
 * Client-Side Product Image White Background & E-Commerce Studio Engine
 * 
 * Features:
 * - High-precision background segmentation & seed-based color distance
 * - Pure White (#FFFFFF) & Studio Off-White backdrop compositing
 * - Natural soft floor contact shadow, floating drop shadow & mirror reflection
 * - Edge defringe/despill (eliminates dark/tinted halos against white)
 * - Safe e-commerce padding & square (1:1) / multi-aspect framing
 * - 100% In-browser processing with zero server uploads
 */

export interface ProductWhiteBgOptions {
  tolerance: number; // 1 to 100 (threshold for background matching)
  feather: number; // 0 to 8px (edge smoothing)
  despill: number; // 0 to 100% (defringe ambient background halo)
  bgType: 'pure-white' | 'studio-warm' | 'studio-cool' | 'transparent' | 'custom';
  customColor: string;
  shadowType: 'none' | 'soft-floor' | 'drop-shadow' | 'reflection';
  shadowOpacity: number; // 0 to 100%
  shadowBlur: number; // 0 to 40px
  paddingPercent: number; // 0% to 35% margin around product
  aspectRatio: 'original' | '1:1' | '4:3' | '3:4' | '16:9';
  autoCenter: boolean;
  brightness: number; // -30 to +30
  contrast: number; // -30 to +30
  whiteClean: boolean; // Clean near-whites to pure #FFFFFF
}

export interface LoadedProductImageInfo {
  img: HTMLImageElement;
  name: string;
  originalWidth: number;
  originalHeight: number;
  fileSize: number;
  fileType: string;
}

export const DEFAULT_PRODUCT_OPTIONS: ProductWhiteBgOptions = {
  tolerance: 28,
  feather: 2,
  despill: 60,
  bgType: 'pure-white',
  customColor: '#FFFFFF',
  shadowType: 'soft-floor',
  shadowOpacity: 35,
  shadowBlur: 14,
  paddingPercent: 10,
  aspectRatio: '1:1',
  autoCenter: true,
  brightness: 4,
  contrast: 6,
  whiteClean: true,
};

export const PRODUCT_PRESETS: Record<string, Partial<ProductWhiteBgOptions>> = {
  amazon: {
    bgType: 'pure-white',
    tolerance: 30,
    feather: 2,
    despill: 70,
    shadowType: 'soft-floor',
    shadowOpacity: 25,
    paddingPercent: 12,
    aspectRatio: '1:1',
    whiteClean: true,
    brightness: 5,
    contrast: 5,
  },
  shopify: {
    bgType: 'pure-white',
    tolerance: 26,
    feather: 2,
    despill: 60,
    shadowType: 'drop-shadow',
    shadowOpacity: 35,
    shadowBlur: 16,
    paddingPercent: 10,
    aspectRatio: '1:1',
    whiteClean: true,
    brightness: 4,
    contrast: 6,
  },
  warmStudio: {
    bgType: 'studio-warm',
    tolerance: 28,
    feather: 3,
    despill: 50,
    shadowType: 'soft-floor',
    shadowOpacity: 40,
    paddingPercent: 12,
    aspectRatio: 'original',
    whiteClean: false,
    brightness: 2,
    contrast: 4,
  },
  cutoutOnly: {
    bgType: 'transparent',
    tolerance: 28,
    feather: 2,
    despill: 80,
    shadowType: 'none',
    paddingPercent: 0,
    aspectRatio: 'original',
    whiteClean: false,
    brightness: 0,
    contrast: 0,
  },
};

/**
 * Load image file into HTMLImageElement
 */
export function loadProductImageFromFile(file: File): Promise<LoadedProductImageInfo> {
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
 * Extract background sample seeds from perimeter and corners
 */
function sampleBackgroundColors(data: Uint8ClampedArray, width: number, height: number): Array<[number, number, number]> {
  const samples: Array<[number, number, number]> = [];
  const coords = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
    [Math.floor(width / 2), 2],
    [Math.floor(width / 2), height - 3],
    [2, Math.floor(height / 2)],
    [width - 3, Math.floor(height / 2)],
  ];

  for (const [x, y] of coords) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] > 100) {
        samples.push([data[idx], data[idx + 1], data[idx + 2]]);
      }
    }
  }

  if (samples.length === 0) {
    samples.push([255, 255, 255]);
  }
  return samples;
}

/**
 * Calculate color distance with luminance weighting
 */
function colorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  // Redmean human perceptual color metric
  const rBar = (r1 + r2) / 2;
  return Math.sqrt((2 + rBar / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rBar) / 256) * db * db);
}

/**
 * Generate Product Cutout Canvas (transparent subject)
 */
export function generateProductCutout(
  sourceImg: HTMLImageElement,
  options: ProductWhiteBgOptions,
  maxDim?: number
): { cutoutCanvas: HTMLCanvasElement; subjectBounds: { x: number; y: number; width: number; height: number } } {
  const origW = sourceImg.naturalWidth || sourceImg.width;
  const origH = sourceImg.naturalHeight || sourceImg.height;

  let width = origW;
  let height = origH;
  if (maxDim && (origW > maxDim || origH > maxDim)) {
    const scale = Math.min(maxDim / origW, maxDim / origH);
    width = Math.round(origW * scale);
    height = Math.round(origH * scale);
  }

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = width;
  srcCanvas.height = height;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true })!;
  srcCtx.drawImage(sourceImg, 0, 0, width, height);

  const imgData = srcCtx.getImageData(0, 0, width, height);
  const srcData = imgData.data;

  const bgSeeds = sampleBackgroundColors(srcData, width, height);
  const tolDist = (options.tolerance / 100) * 220 + 15;
  const feather = Math.max(0, options.feather);
  const despillNorm = options.despill / 100;

  // Mask array: 0 (background) to 255 (subject)
  const mask = new Uint8ClampedArray(width * height);

  // 1. Initial color classification
  for (let i = 0; i < width * height; i++) {
    const pIdx = i * 4;
    const a = srcData[pIdx + 3];
    if (a < 20) {
      mask[i] = 0;
      continue;
    }

    const r = srcData[pIdx];
    const g = srcData[pIdx + 1];
    const b = srcData[pIdx + 2];

    let minDist = Infinity;
    for (const [sr, sg, sb] of bgSeeds) {
      const dist = colorDistance(r, g, b, sr, sg, sb);
      if (dist < minDist) minDist = dist;
    }

    if (minDist <= tolDist) {
      // Background pixel
      mask[i] = 0;
    } else if (minDist < tolDist + 25) {
      // Soft transition edge
      const edgeFactor = (minDist - tolDist) / 25;
      mask[i] = Math.round(edgeFactor * 255);
    } else {
      // Foreground subject
      mask[i] = 255;
    }
  }

  // 2. Flood Fill from perimeter to prevent removing subject interiors that match background color
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  // Seed boundary queue
  for (let x = 0; x < width; x++) {
    if (mask[x] < 200) { queue.push(x); visited[x] = 1; }
    const botIdx = (height - 1) * width + x;
    if (mask[botIdx] < 200) { queue.push(botIdx); visited[botIdx] = 1; }
  }
  for (let y = 0; y < height; y++) {
    const leftIdx = y * width;
    if (mask[leftIdx] < 200 && !visited[leftIdx]) { queue.push(leftIdx); visited[leftIdx] = 1; }
    const rightIdx = y * width + (width - 1);
    if (mask[rightIdx] < 200 && !visited[rightIdx]) { queue.push(rightIdx); visited[rightIdx] = 1; }
  }

  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const x = idx % width;
    const y = Math.floor(idx / width);

    const neighbors = [
      y > 0 ? idx - width : -1,
      y < height - 1 ? idx + width : -1,
      x > 0 ? idx - 1 : -1,
      x < width - 1 ? idx + 1 : -1,
    ];

    for (const nIdx of neighbors) {
      if (nIdx >= 0 && !visited[nIdx] && mask[nIdx] < 220) {
        visited[nIdx] = 1;
        queue.push(nIdx);
      }
    }
  }

  // Any non-visited pixels are definitively subject interior
  for (let i = 0; i < width * height; i++) {
    if (!visited[i] && mask[i] < 255) {
      mask[i] = 255;
    }
  }

  // 3. Optional Gaussian / Box Feathering on Mask Edges
  let finalMask = mask;
  if (feather > 0) {
    finalMask = new Uint8ClampedArray(width * height);
    const rad = Math.round(feather);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
        for (let dy = -rad; dy <= rad; dy++) {
          const ny = Math.min(Math.max(y + dy, 0), height - 1);
          for (let dx = -rad; dx <= rad; dx++) {
            const nx = Math.min(Math.max(x + dx, 0), width - 1);
            sum += mask[ny * width + nx];
            count++;
          }
        }
        finalMask[y * width + x] = Math.round(sum / count);
      }
    }
  }

  // 4. Build transparent cutout and find subject bounds
  const cutoutCanvas = document.createElement('canvas');
  cutoutCanvas.width = width;
  cutoutCanvas.height = height;
  const outCtx = cutoutCanvas.getContext('2d')!;
  const outImgData = outCtx.createImageData(width, height);
  const outData = outImgData.data;

  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  let foundPixels = 0;

  const bBoost = (options.brightness / 100) * 50;
  const cBoost = 1 + (options.contrast / 100);

  for (let i = 0; i < width * height; i++) {
    const alpha = finalMask[i];
    const pIdx = i * 4;

    if (alpha > 5) {
      const x = i % width;
      const y = Math.floor(i / width);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      foundPixels++;

      let r = srcData[pIdx];
      let g = srcData[pIdx + 1];
      let b = srcData[pIdx + 2];

      // Tone Adjustments (Brightness & Contrast)
      if (bBoost !== 0 || cBoost !== 1) {
        r = (r - 128) * cBoost + 128 + bBoost;
        g = (g - 128) * cBoost + 128 + bBoost;
        b = (b - 128) * cBoost + 128 + bBoost;
      }

      // Edge Despill: suppress background tint bleed on semi-transparent fringe
      if (despillNorm > 0 && alpha < 240) {
        const avgBgR = bgSeeds[0][0];
        const avgBgG = bgSeeds[0][1];
        const avgBgB = bgSeeds[0][2];

        const blendRatio = (1 - alpha / 255) * despillNorm;
        r = r - (avgBgR - 255) * blendRatio;
        g = g - (avgBgG - 255) * blendRatio;
        b = b - (avgBgB - 255) * blendRatio;
      }

      outData[pIdx] = Math.max(0, Math.min(255, Math.round(r)));
      outData[pIdx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      outData[pIdx + 2] = Math.max(0, Math.min(255, Math.round(b)));
      outData[pIdx + 3] = alpha;
    } else {
      outData[pIdx + 3] = 0;
    }
  }

  outCtx.putImageData(outImgData, 0, 0);

  if (foundPixels === 0) {
    minX = 0;
    minY = 0;
    maxX = width;
    maxY = height;
  }

  const bounds = {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX + 1),
    height: Math.max(1, maxY - minY + 1),
  };

  return { cutoutCanvas, subjectBounds: bounds };
}

/**
 * Render Complete Composed Product Image on White/Studio Canvas with Shadows & Framing
 */
export function renderComposedProductCanvas(
  sourceImg: HTMLImageElement,
  options: ProductWhiteBgOptions,
  maxDim?: number
): HTMLCanvasElement {
  const { cutoutCanvas, subjectBounds } = generateProductCutout(sourceImg, options, maxDim);

  const cutW = cutoutCanvas.width;
  const cutH = cutoutCanvas.height;

  // Determine Output Canvas Aspect Ratio & Dimensions
  let targetWidth = cutW;
  let targetHeight = cutH;

  if (options.aspectRatio === '1:1') {
    const sqSize = Math.max(cutW, cutH);
    targetWidth = sqSize;
    targetHeight = sqSize;
  } else if (options.aspectRatio === '4:3') {
    targetWidth = cutW;
    targetHeight = Math.round((cutW * 3) / 4);
    if (targetHeight < cutH) {
      targetHeight = cutH;
      targetWidth = Math.round((cutH * 4) / 3);
    }
  } else if (options.aspectRatio === '3:4') {
    targetWidth = cutW;
    targetHeight = Math.round((cutW * 4) / 3);
    if (targetHeight < cutH) {
      targetHeight = cutH;
      targetWidth = Math.round((cutH * 3) / 4);
    }
  } else if (options.aspectRatio === '16:9') {
    targetWidth = cutW;
    targetHeight = Math.round((cutW * 9) / 16);
    if (targetHeight < cutH) {
      targetHeight = cutH;
      targetWidth = Math.round((cutH * 16) / 9);
    }
  }

  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetWidth;
  outCanvas.height = targetHeight;
  const ctx = outCanvas.getContext('2d')!;

  // 1. Draw Background
  if (options.bgType === 'pure-white') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (options.bgType === 'studio-warm') {
    // Soft subtle vertical studio vignette
    const grad = ctx.createLinearGradient(0, 0, 0, targetHeight);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.7, '#F9FAFB');
    grad.addColorStop(1, '#F3F4F6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (options.bgType === 'studio-cool') {
    const grad = ctx.createLinearGradient(0, 0, 0, targetHeight);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(1, '#EDF2F7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (options.bgType === 'custom') {
    ctx.fillStyle = options.customColor || '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (options.bgType === 'transparent') {
    // Leave fully transparent
    ctx.clearRect(0, 0, targetWidth, targetHeight);
  }

  // 2. Compute Product Placement with Padding
  const padRatio = Math.max(0, Math.min(0.4, options.paddingPercent / 100));
  const availW = targetWidth * (1 - padRatio * 2);
  const availH = targetHeight * (1 - padRatio * 2);

  // Subject scale
  const scale = Math.min(availW / subjectBounds.width, availH / subjectBounds.height, 1.2);
  const drawW = subjectBounds.width * scale;
  const drawH = subjectBounds.height * scale;

  let destX = (targetWidth - drawW) / 2;
  let destY = (targetHeight - drawH) / 2;

  if (!options.autoCenter) {
    destX = (targetWidth - cutW) / 2 + subjectBounds.x;
    destY = (targetHeight - cutH) / 2 + subjectBounds.y;
  }

  // 3. Render Grounding & Shadows (if background is not transparent or shadow requested)
  if (options.shadowType !== 'none') {
    ctx.save();
    const shadowAlpha = (options.shadowOpacity / 100) * 0.7;

    if (options.shadowType === 'soft-floor') {
      // Realistic soft studio floor contact ellipse shadow under subject bottom
      const shadowW = drawW * 0.85;
      const shadowH = Math.max(6, drawH * 0.09);
      const shadowCenterX = destX + drawW / 2;
      const shadowCenterY = destY + drawH + shadowH * 0.15;

      const shadowGrad = ctx.createRadialGradient(
        shadowCenterX, shadowCenterY, shadowW * 0.05,
        shadowCenterX, shadowCenterY, shadowW * 0.5
      );
      shadowGrad.addColorStop(0, `rgba(15, 23, 42, ${shadowAlpha})`);
      shadowGrad.addColorStop(0.5, `rgba(30, 41, 59, ${shadowAlpha * 0.45})`);
      shadowGrad.addColorStop(1, 'rgba(30, 41, 59, 0)');

      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(shadowCenterX, shadowCenterY, shadowW / 2, shadowH, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (options.shadowType === 'drop-shadow') {
      // Floating soft directional drop shadow
      ctx.shadowColor = `rgba(15, 23, 42, ${shadowAlpha})`;
      ctx.shadowBlur = options.shadowBlur || 14;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = Math.max(4, options.shadowBlur * 0.6);

      // Draw shadow silhouette
      ctx.drawImage(
        cutoutCanvas,
        subjectBounds.x, subjectBounds.y, subjectBounds.width, subjectBounds.height,
        destX, destY, drawW, drawH
      );
      ctx.shadowColor = 'transparent';
    } else if (options.shadowType === 'reflection') {
      // Mirror glossy surface reflection under product
      ctx.save();
      ctx.translate(0, destY + drawH * 2);
      ctx.scale(1, -1);
      ctx.globalAlpha = shadowAlpha * 0.4;
      ctx.drawImage(
        cutoutCanvas,
        subjectBounds.x, subjectBounds.y, subjectBounds.width, subjectBounds.height,
        destX, destY, drawW, drawH
      );
      ctx.restore();

      // Fade reflection with gradient mask
      const refGrad = ctx.createLinearGradient(0, destY + drawH, 0, destY + drawH + drawH * 0.4);
      refGrad.addColorStop(0, options.bgType === 'pure-white' ? 'rgba(255,255,255,0.2)' : 'rgba(245,245,245,0.2)');
      refGrad.addColorStop(1, options.bgType === 'pure-white' ? '#FFFFFF' : '#F9FAFB');
      ctx.fillStyle = refGrad;
      ctx.fillRect(destX, destY + drawH, drawW, drawH * 0.45);
    }
    ctx.restore();
  }

  // 4. Draw Scaled Subject Cutout
  ctx.drawImage(
    cutoutCanvas,
    subjectBounds.x, subjectBounds.y, subjectBounds.width, subjectBounds.height,
    destX, destY, drawW, drawH
  );

  return outCanvas;
}

/**
 * Generate Realistic Sample Product (Luxury Wireless Headphones on studio backdrop)
 */
export function generateSampleProductImage(): Promise<LoadedProductImageInfo> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const width = 900;
    const height = 900;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // 1. Off-white textured studio room background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#e2e8f0');
    bgGrad.addColorStop(0.5, '#cbd5e1');
    bgGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Floor horizon shadow line
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 680, width, 4);

    // 2. Draw Premium Wireless Headphones (Matte Black & Metallic Copper)
    const cx = width / 2;
    const cy = 440;

    // Headband Arch
    ctx.beginPath();
    ctx.lineWidth = 42;
    ctx.strokeStyle = '#1e293b';
    ctx.arc(cx, cy - 20, 180, Math.PI * 0.9, Math.PI * 2.1, false);
    ctx.stroke();

    // Headband Comfort Cushion
    ctx.beginPath();
    ctx.lineWidth = 22;
    ctx.strokeStyle = '#0f172a';
    ctx.arc(cx, cy - 20, 168, Math.PI * 0.98, Math.PI * 2.02, false);
    ctx.stroke();

    // Copper Metal Sliders
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(cx - 195, cy + 30, 26, 70);
    ctx.fillRect(cx + 169, cy + 30, 26, 70);

    // Left Ear Cup (Angled 3D)
    ctx.save();
    ctx.translate(cx - 180, cy + 120);
    ctx.rotate(-0.15);
    // Outer Shell
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 62, 95, 0, 0, Math.PI * 2);
    ctx.fill();
    // Copper Accent Ring
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 52, 82, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Leather Ear Cushion
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(15, 0, 35, 78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right Ear Cup
    ctx.save();
    ctx.translate(cx + 180, cy + 120);
    ctx.rotate(0.15);
    // Outer Shell
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 62, 95, 0, 0, Math.PI * 2);
    ctx.fill();
    // Copper Accent Ring
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 52, 82, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Leather Cushion
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(-15, 0, 35, 78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Subtle gloss highlight on headband
    const hiGrad = ctx.createLinearGradient(cx - 60, cy - 210, cx + 60, cy - 170);
    hiGrad.addColorStop(0, 'rgba(255,255,255,0)');
    hiGrad.addColorStop(0.5, 'rgba(255,255,255,0.4)');
    hiGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.lineWidth = 8;
    ctx.strokeStyle = hiGrad;
    ctx.beginPath();
    ctx.arc(cx, cy - 20, 198, Math.PI * 1.35, Math.PI * 1.65, false);
    ctx.stroke();

    const img = new Image();
    img.onload = () => {
      resolve({
        img,
        name: 'sample-studio-product.jpg',
        originalWidth: width,
        originalHeight: height,
        fileSize: 185000,
        fileType: 'image/jpeg',
      });
    };
    img.src = canvas.toDataURL('image/jpeg', 0.95);
  });
}

/**
 * Export product image with user-specified format & quality
 */
export function exportProductImage(
  canvas: HTMLCanvasElement,
  format: 'image/png' | 'image/webp' | 'image/jpeg' = 'image/jpeg',
  quality = 0.92,
  filename = 'imgfeel-product-white-bg'
): void {
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
 * Copy product canvas directly to clipboard as PNG
 */
export async function copyProductCanvasToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
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
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        resolve(true);
      } catch {
        resolve(false);
      }
    }, 'image/png');
  });
}
