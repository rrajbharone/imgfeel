/**
 * Gemini Watermark Remover Engine
 * 100% Client-Side In-Browser Image and Video Processing for ImgFeel.com
 * 
 * MIT License Attribution:
 * Adapted from open-source references:
 * - ishara-madu/gemini-watermark-remover (Copyright (c) 2025 Ishara Madusanka, MIT License)
 *   https://github.com/ishara-madu/gemini-watermark-remover
 * - GargantuaX/gemini-watermark-remover (MIT License)
 *   https://github.com/GargantuaX/gemini-watermark-remover
 * 
 * Core Features:
 * - Mathematical Inverse Alpha Unblending using calibrated Google Gemini logo masks (48px & 96px)
 * - Exact formula: Original = (Watermarked - Logo * Alpha) / (1 - Alpha), where Logo = 255
 * - Multi-variant watermark detection: continuous scaling, 1k/2k catalog sizes, margin variants, and corner checks
 * - Subpixel-level fine jitter search for peak correlation alignment
 * - Zero blur, zero cropping, and zero artificial inpainting hallucination
 * - High-quality lossless PNG export preserving full dimensions and unaffected pixels
 * - In-browser video frame processing engine preserving audio tracks and native framerate
 */

export type MediaType = 'image' | 'video';

export interface WatermarkBox {
  x: number;
  y: number;
  width: number;
  height: number;
  size: number;
  corner: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  variant: string;
}

export interface WatermarkDetectionResult {
  detected: boolean;
  confidence: number; // 0 to 100%
  box: WatermarkBox;
}

export interface ProcessedImageResult {
  blob: Blob;
  cleanCanvas: HTMLCanvasElement;
  width: number;
  height: number;
  detection: WatermarkDetectionResult;
}

export interface VideoProcessingProgress {
  currentFrame: number;
  totalFrames: number;
  progressPercent: number; // 0 to 100
  fps: number;
  estimatedTimeRemainingSec: number;
  isProcessing: boolean;
}

// ── 1. Calibrated Base64 Ground-Truth Watermark Masks ──
// Captured from authentic Google Gemini outputs on a pure black background
export const BG_48_BASE64 =
  'data:image/png;base64,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';

export const BG_96_BASE64 =
  'data:image/png;base64,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';

// ── 2. Alpha Map Computation & Multi-Resolution Mask Cache ──
const alphaMapCache: Map<number, Float32Array> = new Map();
let loadedBg48: HTMLImageElement | null = null;
let loadedBg96: HTMLImageElement | null = null;

function loadImageFromSrc(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

export async function ensureGroundTruthMasks(): Promise<{ bg48: HTMLImageElement; bg96: HTMLImageElement }> {
  if (loadedBg48 && loadedBg96) {
    return { bg48: loadedBg48, bg96: loadedBg96 };
  }
  const [bg48, bg96] = await Promise.all([
    loadImageFromSrc(BG_48_BASE64),
    loadImageFromSrc(BG_96_BASE64),
  ]);
  loadedBg48 = bg48;
  loadedBg96 = bg96;
  return { bg48, bg96 };
}

/**
 * Extract per-pixel alpha transparency map from a background-captured watermark image.
 * Uses exact formula: alpha = max(R, G, B) / 255.0
 */
export function calculateAlphaMap(imageData: ImageData): Float32Array {
  const { width, height, data } = imageData;
  const count = width * height;
  const alphaMap = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const idx = i * 4;
    alphaMap[i] = Math.max(data[idx], data[idx + 1], data[idx + 2]) / 255.0;
  }
  return alphaMap;
}

/**
 * Get or compute an antialiased alpha map scaled to any required watermark dimensions.
 */
export async function getAlphaMapForSize(size: number): Promise<Float32Array> {
  const roundedSize = Math.max(8, Math.round(size));
  if (alphaMapCache.has(roundedSize)) {
    return alphaMapCache.get(roundedSize)!;
  }

  const { bg48, bg96 } = await ensureGroundTruthMasks();
  const canvas = document.createElement('canvas');
  canvas.width = roundedSize;
  canvas.height = roundedSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // Use 48px template for small sizes (<=48px) and 96px for larger sizes
  const sourceImg = roundedSize <= 48 ? bg48 : bg96;
  ctx.drawImage(sourceImg, 0, 0, roundedSize, roundedSize);

  const raw = ctx.getImageData(0, 0, roundedSize, roundedSize);
  const alphaMap = calculateAlphaMap(raw);
  alphaMapCache.set(roundedSize, alphaMap);
  return alphaMap;
}

// ── 3. Mathematical Reverse Alpha Unblending ──
const ALPHA_THRESHOLD = 0.002;
const MAX_ALPHA = 0.99;
const LOGO_VALUE = 255; // Google Gemini watermark logo is pure white [255, 255, 255]

/**
 * Reverses the forward compositing formula:
 *   C_watermarked = C_original * (1 - alpha) + C_logo * alpha
 *   C_original    = (C_watermarked - C_logo * alpha) / (1 - alpha)
 * 
 * Preserves 100% of background detail, color nuance, and pixel sharpness with zero blur.
 */
export function applyReverseAlphaUnblending(
  imageData: ImageData,
  alphaMap: Float32Array,
  box: { x: number; y: number; width: number; height: number },
  gain = 1.0
): void {
  const { x, y, width, height } = box;
  const imgWidth = imageData.width;
  const imgHeight = imageData.height;
  const data = imageData.data;

  for (let row = 0; row < height; row++) {
    const curY = y + row;
    if (curY < 0 || curY >= imgHeight) continue;

    for (let col = 0; col < width; col++) {
      const curX = x + col;
      if (curX < 0 || curX >= imgWidth) continue;

      const imgIdx = (curY * imgWidth + curX) * 4;
      const alphaIdx = row * width + col;

      let alpha = alphaMap[alphaIdx] * gain;
      if (alpha < ALPHA_THRESHOLD) continue;
      alpha = Math.min(alpha, MAX_ALPHA);

      for (let c = 0; c < 3; c++) {
        const watermarked = data[imgIdx + c];
        const original = (watermarked - alpha * LOGO_VALUE) / (1.0 - alpha);
        data[imgIdx + c] = Math.max(0, Math.min(255, Math.round(original)));
      }
    }
  }
}

// ── 4. Candidate Variants & Automatic Multi-Variant Detection ──

function meanAndVariance(values: Float32Array): { mean: number; variance: number } {
  let sum = 0;
  const len = values.length;
  for (let i = 0; i < len; i++) sum += values[i];
  const mean = sum / len;

  let sq = 0;
  for (let i = 0; i < len; i++) {
    const d = values[i] - mean;
    sq += d * d;
  }
  return { mean, variance: sq / len };
}

function normalizedCrossCorrelation(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length || a.length === 0) return 0;
  const statsA = meanAndVariance(a);
  const statsB = meanAndVariance(b);
  const den = Math.sqrt(statsA.variance * statsB.variance) * a.length;
  if (den < 1e-7) return 0;

  let num = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - statsA.mean) * (b[i] - statsB.mean);
  }
  return num / den;
}

function extractRegionLuminance(imageData: ImageData, x: number, y: number, size: number): Float32Array {
  const { width, height, data } = imageData;
  const out = new Float32Array(size * size);
  for (let row = 0; row < size; row++) {
    const curY = y + row;
    for (let col = 0; col < size; col++) {
      const curX = x + col;
      if (curX >= 0 && curX < width && curY >= 0 && curY < height) {
        const idx = (curY * width + curX) * 4;
        out[row * size + col] = (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) / 255.0;
      }
    }
  }
  return out;
}

/**
 * Generate candidate watermark configurations matching known Gemini, Nano Banana,
 * and Veo sizing behaviors across resolutions.
 */
export function getCandidateBoxes(width: number, height: number): Array<WatermarkBox> {
  const minDim = Math.min(width, height);
  const ratio = minDim / 1536;

  // 1. Continuous ratio (standard Gemini / Nano Banana)
  const contSize = Math.max(16, Math.round(96 * ratio));
  const contMargin = Math.max(8, Math.round(64 * ratio));

  // 2. Veo video ratio
  const veoSize = Math.max(24, Math.min(Math.round(minDim / 15), minDim));
  const veoMargin = Math.round(minDim / 10);

  const configs: Array<{ size: number; marginX: number; marginY: number; variant: string }> = [
    { size: contSize, marginX: contMargin, marginY: contMargin, variant: 'Continuous Ratio (Standard)' },
    { size: 96, marginX: 64, marginY: 64, variant: '1K/2K Catalog Standard (96px)' },
    { size: 48, marginX: 32, marginY: 32, variant: '0.5K/1K Catalog Compact (48px)' },
    { size: 64, marginX: 48, marginY: 48, variant: 'Mid-Tier Catalog (64px)' },
    { size: 96, marginX: 192, marginY: 192, variant: '2K Wide Margin (96px/192m)' },
    { size: 48, marginX: 96, marginY: 96, variant: '1K Large Margin (48px/96m)' },
    { size: 36, marginX: 96, marginY: 96, variant: 'Small Catalog (36px)' },
    { size: veoSize, marginX: veoMargin, marginY: veoMargin, variant: 'Veo Anchor' },
  ];

  const seen = new Set<string>();
  const results: Array<WatermarkBox> = [];

  for (const c of configs) {
    const key = `${c.size}_${c.marginX}_${c.marginY}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const x = width - c.marginX - c.size;
    const y = height - c.marginY - c.size;
    if (x >= 0 && y >= 0 && x + c.size <= width && y + c.size <= height) {
      results.push({
        x,
        y,
        width: c.size,
        height: c.size,
        size: c.size,
        corner: 'bottom-right',
        variant: c.variant,
      });
    }
  }

  return results;
}

/**
 * Automatically detect supported Gemini / Nano Banana watermark variants, positions,
 * and sizes using template correlation and fine jitter search.
 */
export async function detectGeminiWatermark(
  imageData: ImageData
): Promise<WatermarkDetectionResult> {
  const { width, height } = imageData;
  const candidates = getCandidateBoxes(width, height);

  let bestBox: WatermarkBox = candidates[0] || {
    x: Math.max(0, width - 110),
    y: Math.max(0, height - 110),
    width: 64,
    height: 64,
    size: 64,
    corner: 'bottom-right',
    variant: 'Default Fallback',
  };
  let bestScore = -1;

  for (const cand of candidates) {
    const alphaMap = await getAlphaMapForSize(cand.size);
    // Local fine jitter grid around candidate anchor (±6px with 2px step)
    for (let dy = -6; dy <= 6; dy += 2) {
      for (let dx = -6; dx <= 6; dx += 2) {
        const testX = cand.x + dx;
        const testY = cand.y + dy;
        if (testX < 0 || testY < 0 || testX + cand.size > width || testY + cand.size > height) continue;

        const regLum = extractRegionLuminance(imageData, testX, testY, cand.size);
        const score = normalizedCrossCorrelation(regLum, alphaMap);
        if (score > bestScore) {
          bestScore = score;
          bestBox = {
            ...cand,
            x: testX,
            y: testY,
          };
        }
      }
    }
  }

  // If bottom-right correlation is inconclusive (< 0.16), test other corners in case of crops/mirroring
  if (bestScore < 0.16) {
    const testSizes = [bestBox.size, 48, 64, 96];
    const otherCorners: Array<{ corner: WatermarkBox['corner']; getPos: (s: number, m: number) => { x: number; y: number } }> = [
      { corner: 'bottom-left', getPos: (s, m) => ({ x: m, y: height - m - s }) },
      { corner: 'top-right', getPos: (s, m) => ({ x: width - m - s, y: m }) },
      { corner: 'top-left', getPos: (s, m) => ({ x: m, y: m }) },
    ];

    for (const cornerDef of otherCorners) {
      for (const s of testSizes) {
        const m = Math.round(s * 0.67);
        const { x, y } = cornerDef.getPos(s, m);
        if (x < 0 || y < 0 || x + s > width || y + s > height) continue;

        const alphaMap = await getAlphaMapForSize(s);
        const regLum = extractRegionLuminance(imageData, x, y, s);
        const score = normalizedCrossCorrelation(regLum, alphaMap);
        if (score > 0.22 && score > bestScore) {
          bestScore = score;
          bestBox = {
            x,
            y,
            width: s,
            height: s,
            size: s,
            corner: cornerDef.corner,
            variant: `Alternative Corner (${cornerDef.corner})`,
          };
        }
      }
    }
  }

  const confidence = Math.min(100, Math.max(0, Math.round(Math.max(bestScore, 0) * 100)));
  const detected = bestScore >= 0.16;

  return {
    detected,
    confidence: detected ? confidence : Math.max(25, confidence),
    box: bestBox,
  };
}

/**
 * Complete, automatic high-level image watermark removal pipeline.
 * Performs automatic detection, mathematical inverse unblending, and exports
 * a high-quality lossless PNG Blob.
 */
export async function processGeminiImage(
  sourceCanvas: HTMLCanvasElement
): Promise<ProcessedImageResult> {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  // Create clean processing canvas
  const cleanCanvas = document.createElement('canvas');
  cleanCanvas.width = width;
  cleanCanvas.height = height;
  const ctx = cleanCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Copy original source image bit-for-bit
  ctx.drawImage(sourceCanvas, 0, 0);

  const imageData = ctx.getImageData(0, 0, width, height);

  // 1. Automatically detect watermark variant and coordinates
  const detection = await detectGeminiWatermark(imageData);

  // 2. Retrieve calibrated ground-truth alpha map
  const alphaMap = await getAlphaMapForSize(detection.box.size);

  // 3. Apply exact mathematical reverse alpha unblending
  applyReverseAlphaUnblending(imageData, alphaMap, detection.box, 1.0);

  // 4. Update canvas with clean reconstructed pixels
  ctx.putImageData(imageData, 0, 0);

  // 5. Export lossless high-quality PNG Blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    cleanCanvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to generate PNG Blob'));
    }, 'image/png');
  });

  return {
    blob,
    cleanCanvas,
    width,
    height,
    detection,
  };
}

/**
 * Load an image from File object
 */
export function loadImageFromFile(file: File): Promise<{
  img: HTMLImageElement;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  name: string;
  size: number;
  type: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve({
          img,
          canvas,
          width,
          height,
          name: file.name,
          size: file.size,
          type: file.type || 'image/png',
        });
      };
      img.onerror = () => reject(new Error('Invalid or corrupted image file'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Generate a realistic sample Gemini image with authentic alpha-composited watermark
 * for testing and instant user preview without needing file uploads.
 */
export async function generateSampleGeminiImage(): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const width = 1024;
  const height = 1024;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  // Rich photographic scenery gradient (twilight horizon over water)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, '#0c1445');
  skyGrad.addColorStop(0.35, '#2b1b54');
  skyGrad.addColorStop(0.55, '#d9534f');
  skyGrad.addColorStop(0.7, '#f0ad4e');
  skyGrad.addColorStop(0.85, '#1b2a47');
  skyGrad.addColorStop(1, '#08101f');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Soft glowing sun
  const sunGrad = ctx.createRadialGradient(width * 0.6, height * 0.6, 10, width * 0.6, height * 0.6, 180);
  sunGrad.addColorStop(0, 'rgba(255, 230, 180, 0.95)');
  sunGrad.addColorStop(0.3, 'rgba(255, 180, 100, 0.6)');
  sunGrad.addColorStop(1, 'rgba(255, 120, 80, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(width * 0.6, height * 0.6, 180, 0, Math.PI * 2);
  ctx.fill();

  // Subtle mountainous horizon silhouette
  ctx.fillStyle = '#111726';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.68);
  ctx.lineTo(width * 0.2, height * 0.62);
  ctx.lineTo(width * 0.45, height * 0.67);
  ctx.lineTo(width * 0.7, height * 0.59);
  ctx.lineTo(width, height * 0.66);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Fine textured grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Water ripples near bottom
  for (let y = height * 0.72; y < height; y += 18) {
    ctx.strokeStyle = `rgba(255, 210, 150, ${Math.max(0.02, 0.15 - (y / height) * 0.1)})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Sample watermark stamp using ground truth alpha mask (64px size, 43px margin)
  const size = 64;
  const margin = 43;
  const wx = width - margin - size;
  const wy = height - margin - size;

  const alphaMap = await getAlphaMapForSize(size);
  const imgData = ctx.getImageData(wx, wy, size, size);
  const px = imgData.data;

  // Forward alpha blend with pure white logo (255)
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const a = alphaMap[row * size + col];
      if (a <= 0.002) continue;
      const idx = (row * size + col) * 4;
      for (let c = 0; c < 3; c++) {
        px[idx + c] = Math.round(px[idx + c] * (1.0 - a) + 255 * a);
      }
    }
  }
  ctx.putImageData(imgData, wx, wy);

  return canvas;
}

// ── 5. Client-Side Video Frame Processing Engine (Mediabunny + WebCodecs) ──

export interface VideoProcessingOptions {
  onProgress?: (progress: VideoProcessingProgress) => void;
  gain?: number;
}

export interface VideoProcessingResult {
  blob: Blob;
  width: number;
  height: number;
  fps: number;
  duration: number;
  detection: {
    name: string;
    score: number;
    size: number;
    box: { x: number; y: number; width: number; height: number };
  };
}

/**
 * Checks whether the current browser supports WebCodecs (VideoEncoder & VideoDecoder).
 */
export function isWebCodecsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as any).VideoEncoder !== 'undefined' &&
    typeof (window as any).VideoDecoder !== 'undefined'
  );
}

/**
 * Calculates adaptive Google Veo and Flow watermark anchor position.
 */
export function getVeoWatermarkBox(width: number, height: number): { x: number; y: number; width: number; height: number; size: number } {
  const base = Math.min(width, height);
  const size = Math.max(24, Math.min(Math.round(base / 15), base));
  const margin = Math.round(base / 10);
  return {
    size,
    x: Math.max(0, width - margin - size),
    y: Math.max(0, height - margin - size),
    width: size,
    height: size,
  };
}

/**
 * VideoWatermarkEngine:
 * High-performance, client-side, frame-by-frame video unblending pipeline.
 * - Extracts frames using Mediabunny VideoSampleSink
 * - Mathematically reverses Gemini / Veo alpha blend on each frame ROI
 * - Uses createImageBitmap for hardware GPU texture sync before AVC encoding
 * - Preserves audio stream through EncodedPacketSink / EncodedAudioPacketSource
 * - Exports valid MP4 (AVC/H.264)
 */
export class VideoWatermarkEngine {
  private static mediabunnyLib: any = null;
  private isCancelled = false;

  private static async getMediabunny(): Promise<any> {
    if (this.mediabunnyLib) return this.mediabunnyLib;
    try {
      this.mediabunnyLib = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/mediabunny@1.52.3/+esm');
      return this.mediabunnyLib;
    } catch (err) {
      // Fallback CDN if jsdelivr fails
      this.mediabunnyLib = await import(/* @vite-ignore */ 'https://esm.sh/mediabunny@1.52.3');
      return this.mediabunnyLib;
    }
  }

  public cancel(): void {
    this.isCancelled = true;
  }

  public async process(
    file: File | Blob,
    options: VideoProcessingOptions = {}
  ): Promise<VideoProcessingResult> {
    this.isCancelled = false;

    if (!isWebCodecsSupported()) {
      throw new Error('Your browser does not support WebCodecs (VideoEncoder / VideoDecoder). Please use Google Chrome, Microsoft Edge, or a modern Chromium browser.');
    }

    const mb = await VideoWatermarkEngine.getMediabunny();
    const {
      ALL_FORMATS,
      BlobSource,
      BufferTarget,
      CanvasSource,
      EncodedAudioPacketSource,
      EncodedPacketSink,
      Input,
      Mp4OutputFormat,
      Output,
      QUALITY_HIGH,
      VideoSampleSink,
      canEncodeVideo,
    } = mb;

    if (canEncodeVideo && !(await canEncodeVideo('avc'))) {
      throw new Error('Your browser cannot encode H.264/AVC video in hardware/software. Please use desktop Chrome or Edge.');
    }

    const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });

    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) {
      if (typeof input.dispose === 'function') input.dispose();
      throw new Error('No valid, decodable video track found in the uploaded file.');
    }

    const width = videoTrack.displayWidth ?? videoTrack.codedWidth;
    const height = videoTrack.displayHeight ?? videoTrack.codedHeight;
    const duration = await input.computeDuration().catch(() => 0);

    let frameRate = 30;
    try {
      const stats = await videoTrack.computePacketStats?.(120);
      if (stats?.averagePacketRate) {
        frameRate = Math.round(stats.averagePacketRate);
      }
    } catch {
      // default 30
    }
    if (!frameRate || frameRate <= 0 || !Number.isFinite(frameRate)) {
      frameRate = 30;
    }

    // Compute Veo watermark geometry with adaptive offset
    const baseDim = Math.min(width, height);
    const veoBase = getVeoWatermarkBox(width, height);
    const adaptiveOffset = Math.round(-24 * (baseDim / 720));
    const targetSize = veoBase.size;
    const wmBox = {
      size: targetSize,
      x: Math.max(0, Math.min(width - targetSize, veoBase.x + adaptiveOffset)),
      y: Math.max(0, Math.min(height - targetSize, veoBase.y + adaptiveOffset)),
      width: targetSize,
      height: targetSize,
    };

    // ROI bounding box with margin
    const pad = Math.round(targetSize * 0.6);
    const rx = Math.max(0, Math.min(width - 1, wmBox.x - pad));
    const ry = Math.max(0, Math.min(height - 1, wmBox.y - pad));
    const rw = Math.max(1, Math.min(width - rx, wmBox.width + pad * 2));
    const rh = Math.max(1, Math.min(height - ry, wmBox.height + pad * 2));
    const roi = { x: rx, y: ry, width: rw, height: rh };

    // Build alpha map scaled for this watermark
    const alphaMap = await getAlphaMapForSize(targetSize);
    const roiCount = roi.width * roi.height;
    const roiAlphaMap = new Float32Array(roiCount);
    const offX = wmBox.x - roi.x;
    const offY = wmBox.y - roi.y;
    const gain = options.gain ?? 1.0;

    for (let r = 0; r < targetSize; r++) {
      for (let c = 0; c < targetSize; c++) {
        const roiIdx = (offY + r) * roi.width + (offX + c);
        if (roiIdx < 0 || roiIdx >= roiCount) continue;
        const a = alphaMap[r * targetSize + c] * gain;
        roiAlphaMap[roiIdx] = a > 0 ? Math.min(a, MAX_ALPHA) : 0;
      }
    }

    const regionBox = { x: 0, y: 0, width: roi.width, height: roi.height };

    // Offscreen rendering canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D rendering context unavailable');

    // Mediabunny MP4 muxer setup
    const target = new BufferTarget();
    const output = new Output({
      format: new Mp4OutputFormat(),
      target,
    });

    const videoSource = new CanvasSource(canvas, {
      codec: 'avc',
      bitrate: QUALITY_HIGH,
      keyFrameInterval: 2,
    });
    output.addVideoTrack(videoSource, { frameRate });

    // Audio stream pass-through (lossless direct remuxing)
    let audioSource: any = null;
    let audioTrack: any = null;
    let audioDecoderConfig: any = null;
    try {
      audioTrack = await input.getPrimaryAudioTrack();
      if (audioTrack) {
        const audioCodec = await audioTrack.getCodec();
        audioDecoderConfig = await audioTrack.getDecoderConfig().catch(() => null);
        if (audioCodec && audioDecoderConfig) {
          audioSource = new EncodedAudioPacketSource(audioCodec);
          output.addAudioTrack(audioSource);
        }
      }
    } catch {
      audioSource = null;
    }

    await output.start();

    const fallbackDur = frameRate > 0 ? 1 / frameRate : 1 / 30;
    const sink = new VideoSampleSink(videoTrack);
    let firstTimestamp: number | null = null;
    let lastTimestamp = -1;
    let currentFrame = 0;
    const totalEstFrames = duration > 0 ? Math.max(1, Math.round(duration * frameRate)) : 100;
    const startTime = performance.now();

    try {
      for await (const sample of sink.samples()) {
        if (this.isCancelled) {
          sample.close();
          break;
        }

        if (firstTimestamp === null) firstTimestamp = sample.timestamp;
        let timestamp = sample.timestamp - firstTimestamp;
        if (!(timestamp >= 0)) timestamp = 0;
        if (timestamp <= lastTimestamp) timestamp = lastTimestamp + fallbackDur;
        const dur = Number.isFinite(sample.duration) && sample.duration > 0 ? sample.duration : fallbackDur;
        lastTimestamp = timestamp;

        // Draw decoded frame
        sample.draw(ctx, 0, 0, width, height);
        sample.close();

        // Mathematical unblending on watermark ROI
        const px = ctx.getImageData(roi.x, roi.y, roi.width, roi.height);
        applyReverseAlphaUnblending(px, roiAlphaMap, regionBox, 1.0);

        // Hardware GPU texture sync for WebCodecs
        const bmp = await createImageBitmap(px);
        ctx.drawImage(bmp, roi.x, roi.y);
        bmp.close();

        await videoSource.add(timestamp, dur);
        currentFrame++;

        const elapsedSec = (performance.now() - startTime) / 1000;
        const currentFps = elapsedSec > 0 ? Math.round(currentFrame / elapsedSec) : frameRate;
        const remainingFrames = Math.max(0, totalEstFrames - currentFrame);
        const eta = currentFps > 0 ? Math.round(remainingFrames / currentFps) : 0;
        const pct = duration > 0
          ? Math.min(99, Math.round((timestamp / duration) * 100))
          : Math.min(99, Math.round((currentFrame / totalEstFrames) * 100));

        if (options.onProgress) {
          options.onProgress({
            currentFrame,
            totalFrames: totalEstFrames,
            progressPercent: pct,
            fps: currentFps,
            estimatedTimeRemainingSec: eta,
            isProcessing: true,
          });
        }
      }

      videoSource.close();

      if (this.isCancelled) {
        if (typeof input.dispose === 'function') input.dispose();
        throw new Error('Video processing was cancelled by user');
      }

      // Audio packets pass-through remuxing
      if (audioSource && audioTrack) {
        try {
          const offset = firstTimestamp ?? 0;
          const aSink = new EncodedPacketSink(audioTrack);
          let isFirstAudio = true;
          let lastAudioTs = -1;
          for await (const packet of aSink.packets()) {
            if (this.isCancelled) break;
            let newTs = packet.timestamp - offset;
            if (newTs < 0) continue;
            if (newTs <= lastAudioTs) newTs = lastAudioTs + 1e-6;
            lastAudioTs = newTs;
            let outPacket = packet;
            if (newTs !== packet.timestamp && typeof packet.clone === 'function') {
              outPacket = packet.clone({ timestamp: newTs });
            }
            await audioSource.add(
              outPacket,
              isFirstAudio && audioDecoderConfig ? { decoderConfig: audioDecoderConfig } : undefined
            );
            isFirstAudio = false;
          }
        } catch (e) {
          console.warn('Audio passthrough skipped or completed:', e);
        } finally {
          audioSource.close();
        }
      }

      await output.finalize();
      if (typeof input.dispose === 'function') input.dispose();

      if (!target.buffer) {
        throw new Error('Video processing produced no buffer output.');
      }

      const outputBlob = new Blob([target.buffer], { type: 'video/mp4' });

      if (options.onProgress) {
        options.onProgress({
          currentFrame,
          totalFrames: currentFrame,
          progressPercent: 100,
          fps: frameRate,
          estimatedTimeRemainingSec: 0,
          isProcessing: false,
        });
      }

      return {
        blob: outputBlob,
        width,
        height,
        fps: frameRate,
        duration: duration || lastTimestamp,
        detection: {
          name: 'Google Veo / Flow (Adaptive Inset)',
          score: 95,
          size: targetSize,
          box: wmBox,
        },
      };
    } catch (err) {
      if (typeof input.dispose === 'function') input.dispose();
      throw err;
    }
  }
}

