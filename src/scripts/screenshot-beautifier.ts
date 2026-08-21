/**
 * Client-Side Screenshot Beautifier Engine
 * 100% In-Browser Privacy • Turn plain screenshots into polished, high-converting visuals
 */

export type BgType = 'gradient' | 'solid' | 'transparent';
export type FrameType = 'macos-dark' | 'macos-light' | 'browser' | 'none';
export type AspectRatioType = 'auto' | '16:9' | '1:1' | '4:3' | '9:16';
export type ShadowPreset = 'none' | 'soft' | 'medium' | 'dramatic' | 'glow';
export type AlignmentType = 'center' | 'top' | 'bottom';

export interface GradientPreset {
  id: string;
  name: string;
  colors: string[];
  angle: number; // in degrees
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { id: 'sunset', name: 'Sunset Glow', colors: ['#f97316', '#ec4899', '#8b5cf6'], angle: 135 },
  { id: 'cosmic', name: 'Cosmic Nebula', colors: ['#4f46e5', '#7c3aed', '#db2777'], angle: 135 },
  { id: 'cyber', name: 'Hyper Cyber', colors: ['#06b6d4', '#3b82f6', '#6366f1'], angle: 135 },
  { id: 'aurora', name: 'Aurora Borealis', colors: ['#10b981', '#06b6d4', '#3b82f6'], angle: 135 },
  { id: 'golden', name: 'Sunset Gold', colors: ['#f59e0b', '#ef4444', '#7c2d12'], angle: 135 },
  { id: 'midnight', name: 'Velvet Midnight', colors: ['#0f172a', '#1e1b4b', '#312e81'], angle: 135 },
  { id: 'pastel', name: 'Pastel Dream', colors: ['#fdba74', '#f472b6', '#a78bfa'], angle: 135 },
  { id: 'emerald', name: 'Emerald Isle', colors: ['#065f46', '#059669', '#34d399'], angle: 135 },
];

export interface BeautifierOptions {
  bgType: BgType;
  gradientId: string;
  solidColor: string;
  frameType: FrameType;
  aspectRatio: AspectRatioType;
  padding: number; // 16 to 120 px
  radius: number; // 0 to 36 px
  shadow: ShadowPreset;
  scale: number; // 50 to 100 (%)
  alignment: AlignmentType;
  format: 'image/png' | 'image/jpeg' | 'image/webp' | 'original';
  quality: number; // 0.1 to 1.0
}

export interface BeautifyResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  fileSize: number;
  fileSizeFormatted: string;
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
 * Calculates canvas size, screenshot mockup dimensions, and frame layout.
 */
export function calculateBeautifierLayout(
  img: HTMLImageElement,
  options: BeautifierOptions
): {
  canvasWidth: number;
  canvasHeight: number;
  cardX: number;
  cardY: number;
  cardWidth: number;
  cardHeight: number;
  headerHeight: number;
  contentX: number;
  contentY: number;
  contentWidth: number;
  contentHeight: number;
} {
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  // Header height according to frame type
  let headerHeight = 0;
  if (options.frameType === 'macos-dark' || options.frameType === 'macos-light') {
    headerHeight = 36;
  } else if (options.frameType === 'browser') {
    headerHeight = 44;
  }

  const padding = options.padding;
  const scaleFactor = (options.scale || 100) / 100;

  // Raw combined card aspect ratio (header + screenshot)
  const rawCardW = origW;
  const rawCardH = origH + headerHeight;

  let canvasWidth = 0;
  let canvasHeight = 0;

  if (options.aspectRatio === 'auto') {
    canvasWidth = Math.round(rawCardW + padding * 2);
    canvasHeight = Math.round(rawCardH + padding * 2);
  } else {
    // Standard target ratios
    let targetRatio = 16 / 9;
    if (options.aspectRatio === '1:1') targetRatio = 1;
    else if (options.aspectRatio === '4:3') targetRatio = 4 / 3;
    else if (options.aspectRatio === '9:16') targetRatio = 9 / 16;

    // Base canvas size on original image with generous breathing room
    const baseDimension = Math.max(rawCardW, rawCardH) + padding * 2;

    if (targetRatio >= 1) {
      canvasWidth = Math.round(baseDimension * (targetRatio > 1.3 ? 1.2 : 1.1));
      canvasHeight = Math.round(canvasWidth / targetRatio);
    } else {
      canvasHeight = Math.round(baseDimension * 1.2);
      canvasWidth = Math.round(canvasHeight * targetRatio);
    }
  }

  // Maximum available space inside canvas with padding
  const maxAvailW = (canvasWidth - padding * 2) * scaleFactor;
  const maxAvailH = (canvasHeight - padding * 2) * scaleFactor;

  // Fit card into available area
  const fitScale = Math.min(1, maxAvailW / rawCardW, maxAvailH / rawCardH);
  const cardWidth = Math.round(rawCardW * fitScale);
  const cardHeight = Math.round(rawCardH * fitScale);
  const scaledHeaderH = Math.round(headerHeight * fitScale);

  // Positioning
  const cardX = Math.round((canvasWidth - cardWidth) / 2);
  let cardY = Math.round((canvasHeight - cardHeight) / 2);

  if (options.alignment === 'top') {
    cardY = padding;
  } else if (options.alignment === 'bottom') {
    cardY = canvasHeight - padding - cardHeight;
  }

  const contentX = cardX;
  const contentY = cardY + scaledHeaderH;
  const contentWidth = cardWidth;
  const contentHeight = cardHeight - scaledHeaderH;

  return {
    canvasWidth,
    canvasHeight,
    cardX,
    cardY,
    cardWidth,
    cardHeight,
    headerHeight: scaledHeaderH,
    contentX,
    contentY,
    contentWidth,
    contentHeight,
  };
}

/**
 * Draws background (linear gradient, solid color, or transparent)
 */
function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: BeautifierOptions
): void {
  ctx.clearRect(0, 0, width, height);

  if (options.bgType === 'transparent') {
    return; // Transparent canvas
  }

  if (options.bgType === 'solid') {
    ctx.fillStyle = options.solidColor || '#0f172a';
    ctx.fillRect(0, 0, width, height);
    return;
  }

  // Gradient preset
  const preset = GRADIENT_PRESETS.find((p) => p.id === options.gradientId) || GRADIENT_PRESETS[0];

  // Calculate diagonal linear gradient coordinates based on angle
  const angleRad = (preset.angle * Math.PI) / 180;
  const x1 = width / 2 - (Math.cos(angleRad) * width) / 2;
  const y1 = height / 2 - (Math.sin(angleRad) * height) / 2;
  const x2 = width / 2 + (Math.cos(angleRad) * width) / 2;
  const y2 = height / 2 + (Math.sin(angleRad) * height) / 2;

  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  const step = 1 / (preset.colors.length - 1);
  preset.colors.forEach((color, idx) => {
    grad.addColorStop(idx * step, color);
  });

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Configures canvas shadow based on preset.
 */
function applyShadow(
  ctx: CanvasRenderingContext2D,
  preset: ShadowPreset,
  gradientId: string
): void {
  switch (preset) {
    case 'none':
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      break;

    case 'soft':
      ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 12;
      break;

    case 'medium':
      ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 20;
      break;

    case 'dramatic':
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 60;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 30;
      break;

    case 'glow': {
      const gradPreset = GRADIENT_PRESETS.find((p) => p.id === gradientId) || GRADIENT_PRESETS[0];
      const glowColor = gradPreset.colors[1] || '#8b5cf6';
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 50;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 16;
      break;
    }
  }
}

/**
 * Renders the beautified screenshot onto a canvas.
 */
export function renderBeautifiedCanvas(
  img: HTMLImageElement,
  targetCanvas: HTMLCanvasElement,
  options: BeautifierOptions
): void {
  const layout = calculateBeautifierLayout(img, options);

  targetCanvas.width = layout.canvasWidth;
  targetCanvas.height = layout.canvasHeight;

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw Background
  drawBackground(ctx, layout.canvasWidth, layout.canvasHeight, options);

  const radius = Math.max(0, options.radius);

  // 2. Draw Card Base with Drop Shadow
  ctx.save();
  applyShadow(ctx, options.shadow, options.gradientId);

  // Card bounding path
  ctx.beginPath();
  ctx.roundRect(layout.cardX, layout.cardY, layout.cardWidth, layout.cardHeight, radius);
  ctx.fillStyle = options.frameType === 'macos-light' ? '#f8fafc' : '#0f172a';
  ctx.fill();
  ctx.restore();

  // 3. Clip Card Area to prevent overflow & handle rounded corners
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(layout.cardX, layout.cardY, layout.cardWidth, layout.cardHeight, radius);
  ctx.clip();

  // 4. Draw Window Header (if frame selected)
  if (options.frameType === 'macos-dark' || options.frameType === 'macos-light') {
    const isDark = options.frameType === 'macos-dark';
    ctx.fillStyle = isDark ? '#1e293b' : '#f1f5f9';
    ctx.fillRect(layout.cardX, layout.cardY, layout.cardWidth, layout.headerHeight);

    // Subtle bottom border for header
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(layout.cardX, layout.cardY + layout.headerHeight);
    ctx.lineTo(layout.cardX + layout.cardWidth, layout.cardY + layout.headerHeight);
    ctx.stroke();

    // macOS Window Action Dots (Red, Yellow, Green)
    const dotRadius = Math.max(3, Math.round(layout.headerHeight * 0.16));
    const dotY = layout.cardY + layout.headerHeight / 2;
    const dotGap = Math.round(dotRadius * 2.8);
    const startDotX = layout.cardX + Math.round(layout.headerHeight * 0.5);

    const dots = ['#ef4444', '#f59e0b', '#10b981'];
    dots.forEach((color, i) => {
      ctx.beginPath();
      ctx.arc(startDotX + i * dotGap, dotY, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  } else if (options.frameType === 'browser') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(layout.cardX, layout.cardY, layout.cardWidth, layout.headerHeight);

    // Navigation control dots
    const dotRadius = 4;
    const dotY = layout.cardY + layout.headerHeight / 2;
    const dots = ['#ef4444', '#f59e0b', '#10b981'];
    dots.forEach((color, i) => {
      ctx.beginPath();
      ctx.arc(layout.cardX + 16 + i * 12, dotY, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    // Mock URL Address Bar Pill
    const barW = Math.min(layout.cardWidth * 0.55, 320);
    const barH = 22;
    const barX = layout.cardX + (layout.cardWidth - barW) / 2;
    const barY = layout.cardY + (layout.headerHeight - barH) / 2;

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 6);
    ctx.fill();

    // Lock icon & domain text
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔒 imgfeel.com', barX + barW / 2, barY + barH / 2);
  }

  // 5. Draw Screenshot Image
  ctx.drawImage(
    img,
    layout.contentX,
    layout.contentY,
    layout.contentWidth,
    layout.contentHeight
  );

  // 6. Draw Subtle Glass Inner Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(layout.cardX, layout.cardY, layout.cardWidth, layout.cardHeight, radius);
  ctx.stroke();

  ctx.restore();
}

/**
 * Exports beautified canvas to downloadable file.
 */
export async function exportBeautifiedScreenshot(
  img: HTMLImageElement,
  options: BeautifierOptions
): Promise<BeautifyResult> {
  const canvas = document.createElement('canvas');
  renderBeautifiedCanvas(img, canvas, options);

  let exportMime = options.format;
  if (exportMime === 'original') {
    exportMime = options.bgType === 'transparent' ? 'image/png' : 'image/png';
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to generate beautified image blob.'));
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
  };
}

/**
 * Copies the beautified canvas directly to the user's system clipboard as a PNG.
 */
export async function copyBeautifiedToClipboard(
  img: HTMLImageElement,
  options: BeautifierOptions
): Promise<boolean> {
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error('Clipboard API is not supported in this browser.');
  }

  const canvas = document.createElement('canvas');
  renderBeautifiedCanvas(img, canvas, { ...options, format: 'image/png' });

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Failed to create clipboard blob.');

  await navigator.clipboard.write([
    new ClipboardItem({
      'image/png': blob,
    }),
  ]);

  return true;
}

/**
 * Generates an aesthetic SaaS Analytics & Code IDE dashboard sample in-browser.
 */
export async function generateSampleScreenshot(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 600;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 960, 600);

  // Left sidebar
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 200, 600);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('⚡ ImgFeel Analytics', 24, 40);

  const navItems = ['Dashboard', 'Performance', 'Conversions', 'Audience', 'Settings'];
  navItems.forEach((item, i) => {
    if (i === 0) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.roundRect(14, 70 + i * 40, 172, 32, 6);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
    } else {
      ctx.fillStyle = '#94a3b8';
    }
    ctx.font = '13px sans-serif';
    ctx.fillText(item, 28, 91 + i * 40);
  });

  // Main Header
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Monthly Growth Overview', 230, 44);

  ctx.fillStyle = '#64748b';
  ctx.font = '13px sans-serif';
  ctx.fillText('Live metrics updated in real time', 230, 68);

  // Metric Cards
  const stats = [
    { label: 'Active Users', val: '148,290', change: '+24.6%', col: '#10b981' },
    { label: 'Avg. Latency', val: '12.4 ms', change: '-41.2%', col: '#38bdf8' },
    { label: 'Core Web Vitals', val: '99 / 100', change: 'Grade A', col: '#a855f7' },
  ];

  stats.forEach((s, idx) => {
    const cx = 230 + idx * 235;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(cx, 95, 215, 90, 10);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText(s.label, cx + 16, 120);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(s.val, cx + 16, 150);

    ctx.fillStyle = s.col;
    ctx.font = 'bold 11px monospace';
    ctx.fillText(s.change, cx + 16, 172);
  });

  // Chart Canvas Area
  ctx.fillStyle = '#131d31';
  ctx.beginPath();
  ctx.roundRect(230, 210, 690, 360, 12);
  ctx.fill();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px sans-serif';
  ctx.fillText('Traffic & Processing Throughput (Q3)', 250, 240);

  // Render glowing line chart wave
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  const points = [
    [260, 480],
    [330, 430],
    [400, 460],
    [470, 370],
    [540, 390],
    [610, 310],
    [680, 340],
    [750, 280],
    [820, 300],
    [890, 260],
  ];

  points.forEach(([px, py], i) => {
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  // Gradient area under curve
  const chartGrad = ctx.createLinearGradient(0, 260, 0, 520);
  chartGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
  chartGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
  ctx.fillStyle = chartGrad;
  ctx.lineTo(890, 520);
  ctx.lineTo(260, 520);
  ctx.closePath();
  ctx.fill();

  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  return new File([blob], 'sample-dashboard-screenshot.png', { type: 'image/png' });
}
