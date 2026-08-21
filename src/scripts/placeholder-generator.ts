/**
 * Client-Side Image Placeholder Generator Engine for ImgFeel.com
 * 100% In-Browser Privacy, Vector SVG & HTML5 Canvas Rendering
 */

export type PatternType = 'solid' | 'cross' | 'grid' | 'diagonal' | 'dots';
export type FontFamilyType = 'sans' | 'mono' | 'serif' | 'display';
export type FontWeightType = 'normal' | 'medium' | 'bold';
export type TextTransformType = 'none' | 'uppercase' | 'lowercase';
export type ExportFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/svg+xml';

export interface PlaceholderOptions {
  width: number;
  height: number;
  bgColor: string;
  pattern: PatternType;
  customText: string;
  textColor: string;
  fontSize: number | 'auto';
  fontFamily: FontFamilyType;
  fontWeight: FontWeightType;
  textTransform: TextTransformType;
  format?: ExportFormat;
  quality?: number;
}

export interface DimensionPreset {
  id: string;
  label: string;
  width: number;
  height: number;
  category: 'social' | 'web' | 'banner' | 'aspect';
}

export const POPULAR_PRESETS: DimensionPreset[] = [
  // Web & UI
  { id: 'hero-1080', label: '1920 × 1080 (Hero 16:9)', width: 1920, height: 1080, category: 'web' },
  { id: 'card-1200', label: '1200 × 630 (OG / Social Card)', width: 1200, height: 630, category: 'social' },
  { id: 'square-1080', label: '1080 × 1080 (Instagram 1:1)', width: 1080, height: 1080, category: 'social' },
  { id: 'story-1920', label: '1080 × 1920 (Story 9:16)', width: 1080, height: 1920, category: 'social' },
  { id: 'blog-800', label: '800 × 450 (Blog Banner)', width: 800, height: 450, category: 'web' },
  { id: 'card-600', label: '600 × 400 (Card 3:2)', width: 600, height: 400, category: 'web' },
  { id: 'avatar-400', label: '400 × 400 (Avatar)', width: 400, height: 400, category: 'web' },
  { id: 'thumb-300', label: '300 × 200 (Thumbnail)', width: 300, height: 200, category: 'web' },
  
  // Banners / Ads
  { id: 'ad-leaderboard', label: '728 × 90 (Leaderboard)', width: 728, height: 90, category: 'banner' },
  { id: 'ad-rectangle', label: '300 × 250 (Medium Rect)', width: 300, height: 250, category: 'banner' },
  { id: 'ad-skyscraper', label: '160 × 600 (Skyscraper)', width: 160, height: 600, category: 'banner' },
  { id: 'ad-mobile', label: '320 × 50 (Mobile Banner)', width: 320, height: 50, category: 'banner' },
];

export const COLOR_SWATCHES = [
  { name: 'Slate Dark', color: '#0f172a', text: '#ffffff' },
  { name: 'Soft Light Gray', color: '#e2e8f0', text: '#334155' },
  { name: 'Neutral Gray', color: '#94a3b8', text: '#ffffff' },
  { name: 'Vibrant Indigo', color: '#6366f1', text: '#ffffff' },
  { name: 'Emerald Green', color: '#10b981', text: '#ffffff' },
  { name: 'Warm Amber', color: '#f59e0b', text: '#ffffff' },
  { name: 'Rose Red', color: '#f43f5e', text: '#ffffff' },
  { name: 'Sky Blue', color: '#0ea5e9', text: '#ffffff' },
  { name: 'Pure Dark', color: '#000000', text: '#ffffff' },
  { name: 'Transparent', color: 'transparent', text: '#64748b' },
];

/**
 * Calculates responsive auto-fit font size based on dimensions and text length
 */
export function calculateAutoFontSize(width: number, height: number, textLength: number): number {
  const minDim = Math.min(width, height);
  const lengthFactor = Math.max(1, textLength / 10);
  let base = Math.round(minDim / (6 * Math.sqrt(lengthFactor)));
  return Math.min(Math.max(base, 12), 160);
}

/**
 * Resolves font family CSS string
 */
export function getFontFamilyCSS(fontFamily: FontFamilyType): string {
  switch (fontFamily) {
    case 'mono':
      return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
    case 'serif':
      return 'Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif';
    case 'display':
      return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Impact, sans-serif';
    case 'sans':
    default:
      return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  }
}

/**
 * Formats user custom text with tokens
 */
export function formatPlaceholderText(
  rawText: string,
  width: number,
  height: number,
  transform: TextTransformType
): string {
  let text = rawText.trim();
  if (!text) {
    text = `${width} × ${height}`;
  } else {
    text = text
      .replace(/\{width\}/gi, String(width))
      .replace(/\{w\}/gi, String(width))
      .replace(/\{height\}/gi, String(height))
      .replace(/\{h\}/gi, String(height));
  }

  if (transform === 'uppercase') return text.toUpperCase();
  if (transform === 'lowercase') return text.toLowerCase();
  return text;
}

/**
 * Generates an SVG string representation of the placeholder
 */
export function generatePlaceholderSVG(options: PlaceholderOptions): string {
  const { width, height, bgColor, pattern, customText, textColor, fontFamily, fontWeight, textTransform } = options;
  const isTransparent = bgColor === 'transparent';
  const text = formatPlaceholderText(customText, width, height, textTransform);
  const fontSize = typeof options.fontSize === 'number' ? options.fontSize : calculateAutoFontSize(width, height, text.length);
  const fontCss = getFontFamilyCSS(fontFamily);
  const weightCss = fontWeight === 'bold' ? '700' : fontWeight === 'medium' ? '500' : '400';

  let patternSvg = '';
  const strokeColor = textColor;
  const strokeOpacity = isTransparent ? '0.3' : '0.18';

  if (pattern === 'cross') {
    patternSvg = `<line x1="0" y1="0" x2="${width}" y2="${height}" stroke="${strokeColor}" stroke-width="2" stroke-opacity="${strokeOpacity}" stroke-dasharray="6 6" /><line x1="${width}" y1="0" x2="0" y2="${height}" stroke="${strokeColor}" stroke-width="2" stroke-opacity="${strokeOpacity}" stroke-dasharray="6 6" />`;
  } else if (pattern === 'grid') {
    const step = Math.max(20, Math.round(Math.min(width, height) / 10));
    patternSvg = `<defs><pattern id="gridPattern" width="${step}" height="${step}" patternUnits="userSpaceOnUse"><path d="M ${step} 0 L 0 0 0 ${step}" fill="none" stroke="${strokeColor}" stroke-width="1" stroke-opacity="${strokeOpacity}" /></pattern></defs><rect width="${width}" height="${height}" fill="url(#gridPattern)" />`;
  } else if (pattern === 'diagonal') {
    const step = 24;
    patternSvg = `<defs><pattern id="diagPattern" width="${step}" height="${step}" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="${step}" stroke="${strokeColor}" stroke-width="2" stroke-opacity="${strokeOpacity}" /></pattern></defs><rect width="${width}" height="${height}" fill="url(#diagPattern)" />`;
  } else if (pattern === 'dots') {
    const step = Math.max(16, Math.round(Math.min(width, height) / 15));
    patternSvg = `<defs><pattern id="dotPattern" width="${step}" height="${step}" patternUnits="userSpaceOnUse"><circle cx="${step / 2}" cy="${step / 2}" r="1.5" fill="${strokeColor}" fill-opacity="${strokeOpacity}" /></pattern></defs><rect width="${width}" height="${height}" fill="url(#dotPattern)" />`;
  }

  const bgRect = isTransparent
    ? `<rect width="${width}" height="${height}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-opacity="0.25" stroke-dasharray="4 4" />`
    : `<rect width="${width}" height="${height}" fill="${bgColor}" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${bgRect}
  ${patternSvg}
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="${fontCss}" font-size="${fontSize}px" font-weight="${weightCss}" fill="${textColor}">
    ${escapeXml(text)}
  </text>
</svg>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Draws placeholder onto HTML5 Canvas
 */
export function renderPlaceholderToCanvas(canvas: HTMLCanvasElement, options: PlaceholderOptions): void {
  const { width, height, bgColor, pattern, customText, textColor, fontFamily, fontWeight, textTransform } = options;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  const isTransparent = bgColor === 'transparent';

  // 1. Draw Background
  if (!isTransparent) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Draw Pattern Overlays
  ctx.save();
  const strokeColor = textColor;
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;

  if (pattern === 'cross') {
    ctx.globalAlpha = isTransparent ? 0.3 : 0.18;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.moveTo(width, 0);
    ctx.lineTo(0, height);
    ctx.stroke();
  } else if (pattern === 'grid') {
    ctx.globalAlpha = isTransparent ? 0.25 : 0.15;
    ctx.lineWidth = 1;
    const step = Math.max(20, Math.round(Math.min(width, height) / 10));
    ctx.beginPath();
    for (let x = 0; x <= width; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  } else if (pattern === 'diagonal') {
    ctx.globalAlpha = isTransparent ? 0.25 : 0.15;
    ctx.lineWidth = 2;
    const step = 28;
    ctx.beginPath();
    for (let d = -height; d <= width + height; d += step) {
      ctx.moveTo(d, 0);
      ctx.lineTo(d + height, height);
    }
    ctx.stroke();
  } else if (pattern === 'dots') {
    ctx.globalAlpha = isTransparent ? 0.25 : 0.15;
    const step = Math.max(16, Math.round(Math.min(width, height) / 15));
    for (let x = step / 2; x < width; x += step) {
      for (let y = step / 2; y < height; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // If transparent, draw a subtle outer dashed border
  if (isTransparent) {
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(1, 1, width - 2, height - 2);
  }
  ctx.restore();

  // 3. Draw Center Text
  const text = formatPlaceholderText(customText, width, height, textTransform);
  if (text.length > 0) {
    const fontSize = typeof options.fontSize === 'number' ? options.fontSize : calculateAutoFontSize(width, height, text.length);
    const weight = fontWeight === 'bold' ? 'bold' : fontWeight === 'medium' ? '500' : 'normal';
    const fontCss = getFontFamilyCSS(fontFamily);

    ctx.save();
    ctx.font = `${weight} ${fontSize}px ${fontCss}`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Handle multiline text if user entered newlines
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.25;
    const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, index) => {
      ctx.fillText(line, width / 2, startY + index * lineHeight);
    });
    ctx.restore();
  }
}

/**
 * Exports placeholder as Blob and Data URL
 */
export async function exportPlaceholderImage(
  options: PlaceholderOptions
): Promise<{ dataUrl: string; blob: Blob; size: number }> {
  const format = options.format || 'image/png';
  const quality = options.quality ?? 0.92;

  if (format === 'image/svg+xml') {
    const svgString = generatePlaceholderSVG(options);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    return { dataUrl, blob, size: blob.size };
  }

  const canvas = document.createElement('canvas');
  renderPlaceholderToCanvas(canvas, options);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas export failed'));
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            dataUrl: reader.result as string,
            blob,
            size: blob.size,
          });
        };
        reader.onerror = () => reject(new Error('Failed to read blob'));
        reader.readAsDataURL(blob);
      },
      format,
      quality
    );
  });
}

/**
 * Copies placeholder PNG directly to system clipboard
 */
export async function copyPlaceholderToClipboard(options: PlaceholderOptions): Promise<void> {
  const canvas = document.createElement('canvas');
  renderPlaceholderToCanvas(canvas, options);

  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Could not create image blob'));
        return;
      }
      try {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        resolve();
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}
