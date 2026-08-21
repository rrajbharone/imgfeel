/**
 * Client-Side Image Noise Reduction Engine for ImgFeel.com
 * 100% In-Browser Privacy, HTML5 Canvas 2D & Pixel Manipulation
 * Features:
 * - Edge-preserving bilateral luminance smoothing
 * - Chrominance (Color) noise reduction in YCbCr color space
 * - High-frequency detail recovery & sharpness restoration
 * - Median filter for salt-and-pepper grain suppression
 */

export type DenoisePreset = 'balanced' | 'lowlight' | 'portrait' | 'grain';

export interface DenoiseOptions {
  strength: number;     // 0 - 100 (Luminance smoothing intensity)
  colorNoise: number;   // 0 - 100 (Chrominance / color speckled noise reduction)
  sharpness: number;    // 0 - 100 (Edge & fine detail recovery)
  radius: number;       // 1, 2, or 3 (Neighborhood filter radius)
  mode: DenoisePreset;
}

export interface LoadedImageInfo {
  img: HTMLImageElement;
  name: string;
  originalWidth: number;
  originalHeight: number;
  fileSize: number;
  fileType: string;
}

export const PRESET_CONFIGS: Record<DenoisePreset, DenoiseOptions> = {
  balanced: {
    strength: 45,
    colorNoise: 60,
    sharpness: 30,
    radius: 1,
    mode: 'balanced',
  },
  lowlight: {
    strength: 75,
    colorNoise: 90,
    sharpness: 45,
    radius: 2,
    mode: 'lowlight',
  },
  portrait: {
    strength: 35,
    colorNoise: 40,
    sharpness: 20,
    radius: 1,
    mode: 'portrait',
  },
  grain: {
    strength: 65,
    colorNoise: 50,
    sharpness: 50,
    radius: 2,
    mode: 'grain',
  },
};

/**
 * Load an image file into an HTMLImageElement with metadata
 */
export function loadImageFromFile(file: File): Promise<LoadedImageInfo> {
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
 * Fast Edge-Preserving Denoise Filter on ImageData
 */
export function applyDenoiseToImageData(
  srcData: ImageData,
  options: DenoiseOptions
): ImageData {
  const { width, height } = srcData;
  const src = srcData.data;
  const output = new ImageData(width, height);
  const dst = output.data;

  const strengthNorm = Math.max(0, Math.min(100, options.strength)) / 100;
  const colorNorm = Math.max(0, Math.min(100, options.colorNoise)) / 100;
  const sharpNorm = Math.max(0, Math.min(100, options.sharpness)) / 100;
  const radius = Math.max(1, Math.min(3, Math.round(options.radius)));

  // If all sliders are 0, return exact copy
  if (strengthNorm === 0 && colorNorm === 0 && sharpNorm === 0) {
    dst.set(src);
    return output;
  }

  // Pre-calculate spatial Gaussian kernel weights
  const spatialWeights: number[][] = [];
  const sigmaSpatial = radius * 1.2;
  const twoSigmaSpatialSq = 2 * sigmaSpatial * sigmaSpatial;

  for (let dy = -radius; dy <= radius; dy++) {
    const row: number[] = [];
    for (let dx = -radius; dx <= radius; dx++) {
      row.push(Math.exp(-(dx * dx + dy * dy) / twoSigmaSpatialSq));
    }
    spatialWeights.push(row);
  }

  // Range Gaussian variance for bilateral filtering
  const sigmaRangeLum = 12 + strengthNorm * 48;
  const twoSigmaRangeLumSq = 2 * sigmaRangeLum * sigmaRangeLum;

  const sigmaRangeChroma = 15 + colorNorm * 75;
  const twoSigmaRangeChromaSq = 2 * sigmaRangeChroma * sigmaRangeChroma;

  const isGrainMode = options.mode === 'grain' && strengthNorm > 0.3;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r0 = src[idx];
      const g0 = src[idx + 1];
      const b0 = src[idx + 2];
      const a0 = src[idx + 3];

      // If fully transparent pixel, keep as is
      if (a0 === 0) {
        dst[idx] = r0;
        dst[idx + 1] = g0;
        dst[idx + 2] = b0;
        dst[idx + 3] = a0;
        continue;
      }

      // Convert center pixel to YCbCr
      const y0 = 0.299 * r0 + 0.587 * g0 + 0.114 * b0;
      const cb0 = 128 - 0.168736 * r0 - 0.331264 * g0 + 0.5 * b0;
      const cr0 = 128 + 0.5 * r0 - 0.418688 * g0 - 0.081312 * b0;

      let sumWeightLum = 0;
      let sumWeightChroma = 0;
      let accumY = 0;
      let accumCb = 0;
      let accumCr = 0;

      const yNeighbors: number[] = isGrainMode ? [] : [];

      for (let dy = -radius; dy <= radius; dy++) {
        const ny = Math.min(Math.max(y + dy, 0), height - 1);
        const wSpatialRow = spatialWeights[dy + radius];

        for (let dx = -radius; dx <= radius; dx++) {
          const nx = Math.min(Math.max(x + dx, 0), width - 1);
          const nIdx = (ny * width + nx) * 4;

          const nr = src[nIdx];
          const ng = src[nIdx + 1];
          const nb = src[nIdx + 2];

          const nyVal = 0.299 * nr + 0.587 * ng + 0.114 * nb;
          const ncbVal = 128 - 0.168736 * nr - 0.331264 * ng + 0.5 * nb;
          const ncrVal = 128 + 0.5 * nr - 0.418688 * ng - 0.081312 * nb;

          if (isGrainMode) {
            yNeighbors.push(nyVal);
          }

          const wSpatial = wSpatialRow[dx + radius];

          // Luminance weight based on intensity similarity
          const diffY = nyVal - y0;
          const wLum = wSpatial * Math.exp(-(diffY * diffY) / twoSigmaRangeLumSq);

          accumY += nyVal * wLum;
          sumWeightLum += wLum;

          // Chrominance weight
          const diffChroma = (ncbVal - cb0) * (ncbVal - cb0) + (ncrVal - cr0) * (ncrVal - cr0);
          const wChroma = wSpatial * Math.exp(-diffChroma / twoSigmaRangeChromaSq);

          accumCb += ncbVal * wChroma;
          accumCr += ncrVal * wChroma;
          sumWeightChroma += wChroma;
        }
      }

      let filteredY = sumWeightLum > 0 ? accumY / sumWeightLum : y0;
      let filteredCb = sumWeightChroma > 0 ? accumCb / sumWeightChroma : cb0;
      let filteredCr = sumWeightChroma > 0 ? accumCr / sumWeightChroma : cr0;

      // In grain mode, blend with median value for impulsive noise
      if (isGrainMode && yNeighbors.length > 0) {
        yNeighbors.sort((a, b) => a - b);
        const medianY = yNeighbors[Math.floor(yNeighbors.length / 2)];
        filteredY = filteredY * (1 - strengthNorm * 0.4) + medianY * (strengthNorm * 0.4);
      }

      // Blend between original and filtered based on strength
      let finalY = y0 * (1 - strengthNorm) + filteredY * strengthNorm;
      let finalCb = cb0 * (1 - colorNorm) + filteredCb * colorNorm;
      let finalCr = cr0 * (1 - colorNorm) + filteredCr * colorNorm;

      // Detail Recovery & Unsharp Sharpening on Luminance
      if (sharpNorm > 0) {
        const highPass = y0 - finalY;
        finalY = finalY + highPass * (sharpNorm * 1.5);
      }

      // Convert back from YCbCr to RGB
      const c = finalY;
      const d = finalCb - 128;
      const e = finalCr - 128;

      let r = c + 1.402 * e;
      let g = c - 0.344136 * d - 0.714136 * e;
      let b = c + 1.772 * d;

      dst[idx] = Math.max(0, Math.min(255, Math.round(r)));
      dst[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      dst[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
      dst[idx + 3] = a0;
    }
  }

  return output;
}

/**
 * Render denoised result directly to target canvas
 */
export function renderDenoisedCanvas(
  sourceImg: HTMLImageElement,
  targetCanvas: HTMLCanvasElement,
  options: DenoiseOptions,
  maxRenderDim?: number
): void {
  const origW = sourceImg.naturalWidth || sourceImg.width;
  const origH = sourceImg.naturalHeight || sourceImg.height;

  let width = origW;
  let height = origH;

  if (maxRenderDim && maxRenderDim > 0 && (origW > maxRenderDim || origH > maxRenderDim)) {
    const scale = Math.min(maxRenderDim / origW, maxRenderDim / origH);
    width = Math.round(origW * scale);
    height = Math.round(origH * scale);
  }

  targetCanvas.width = width;
  targetCanvas.height = height;

  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  ctx.drawImage(sourceImg, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);

  const denoisedData = applyDenoiseToImageData(imgData, options);
  ctx.putImageData(denoisedData, 0, 0);
}

/**
 * Generate full-resolution output canvas
 */
export function generateFullResolutionCanvas(
  sourceImg: HTMLImageElement,
  options: DenoiseOptions
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const w = sourceImg.naturalWidth || sourceImg.width;
  const h = sourceImg.naturalHeight || sourceImg.height;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (ctx) {
    ctx.drawImage(sourceImg, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const denoised = applyDenoiseToImageData(imgData, options);
    ctx.putImageData(denoised, 0, 0);
  }
  return canvas;
}

/**
 * Generate realistic noisy sample image for 1-click test demo
 */
export function generateSampleNoisyImage(): Promise<LoadedImageInfo> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const width = 1000;
    const height = 680;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // 1. Twilight Night Sky Gradient
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#020617');
    sky.addColorStop(0.4, '#0f172a');
    sky.addColorStop(0.7, '#1e1b4b');
    sky.addColorStop(1, '#312e81');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // 2. Distant City Skyline & Lights
    ctx.fillStyle = '#090d16';
    const buildingWidths = [45, 60, 35, 70, 50, 80, 40, 65, 55, 75, 45, 90, 60, 50, 70, 80];
    let curX = 0;
    for (let i = 0; i < buildingWidths.length; i++) {
      const bW = buildingWidths[i];
      const bH = 180 + Math.sin(i * 1.5) * 80;
      ctx.fillRect(curX, height - bH, bW, bH);

      // Building glowing windows
      ctx.fillStyle = i % 2 === 0 ? 'rgba(253, 224, 71, 0.75)' : 'rgba(251, 146, 60, 0.75)';
      for (let wy = height - bH + 20; wy < height - 20; wy += 22) {
        for (let wx = curX + 8; wx < curX + bW - 8; wx += 14) {
          if ((wx + wy) % 7 !== 0) {
            ctx.fillRect(wx, wy, 6, 8);
          }
        }
      }
      ctx.fillStyle = '#090d16';
      curX += bW + 4;
    }

    // 3. Glowing Moon
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(800, 160, 55, 0, Math.PI * 2);
    ctx.fill();

    // Moon subtle crater details
    ctx.fillStyle = 'rgba(202, 138, 4, 0.25)';
    ctx.beginPath();
    ctx.arc(780, 145, 18, 0, Math.PI * 2);
    ctx.arc(825, 175, 14, 0, Math.PI * 2);
    ctx.fill();

    // 4. Foreground Bridge Silhouette with Neon Reflections
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, height - 100);
    ctx.bezierCurveTo(300, height - 140, 700, height - 80, width, height - 110);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // 5. Title & Info Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Low-Light City Twilight (High ISO 6400)', 40, 60);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Sample demonstration photo with simulated sensor color speckles and luminance grain', 40, 95);

    // 6. Inject Synthetic High-ISO Sensor Noise (Luminance + RGB Chrominance Speckles)
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Luminance grain noise
      const lumNoise = (Math.random() - 0.5) * 52;

      // Chrominance color speckles (red/blue/green noise in shadows)
      const rNoise = (Math.random() - 0.5) * 44;
      const gNoise = (Math.random() - 0.5) * 36;
      const bNoise = (Math.random() - 0.5) * 48;

      data[i] = Math.max(0, Math.min(255, data[i] + lumNoise + rNoise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + lumNoise + gNoise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + lumNoise + bNoise));
    }

    ctx.putImageData(imgData, 0, 0);

    const img = new Image();
    img.onload = () => {
      resolve({
        img,
        name: 'sample-high-iso-night.png',
        originalWidth: width,
        originalHeight: height,
        fileSize: 220000,
        fileType: 'image/png',
      });
    };
    img.src = canvas.toDataURL('image/png');
  });
}

/**
 * Export image canvas with filename and format
 */
export function exportDenoisedImage(
  canvas: HTMLCanvasElement,
  format: 'image/png' | 'image/webp' | 'image/jpeg' = 'image/png',
  quality = 0.92,
  filename = 'imgfeel-denoised'
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
 * Copy denoised canvas directly to clipboard as PNG
 */
export async function copyDenoisedImageToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
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
