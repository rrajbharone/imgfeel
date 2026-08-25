/**
 * ImgFeel SVG Resizer Engine
 * 100% Client-side, privacy-focused, high-accuracy SVG parsing, dimension scaling,
 * viewBox preservation, and multi-format raster export.
 */

export interface SvgMetadata {
  originalWidth: number;
  originalHeight: number;
  originalViewBox: string | null;
  aspectRatio: number;
  fileSize: number;
  fileName: string;
  rawSvgText: string;
  hasViewBox: boolean;
}

export interface ResizeOptions {
  width: number;
  height: number;
  lockAspect: boolean;
  scalePercent: number;
  mode: 'exact' | 'scale' | 'preset';
  format: 'svg' | 'png' | 'webp' | 'jpeg';
  backgroundColor: 'transparent' | '#ffffff' | '#0f172a' | '#1e293b' | string;
  preserveAspectRatio: string;
}

export class SvgResizerEngine {
  private parser: DOMParser;
  private serializer: XMLSerializer;
  public metadata: SvgMetadata | null = null;
  private parsedDoc: Document | null = null;

  constructor() {
    this.parser = new DOMParser();
    this.serializer = new XMLSerializer();
  }

  /**
   * Parse dimension value to numeric pixels
   */
  private parseUnitToPx(val: string | null, fallback: number): number {
    if (!val) return fallback;
    const trimmed = val.trim();
    if (!trimmed) return fallback;

    const num = parseFloat(trimmed);
    if (isNaN(num) || num <= 0) return fallback;

    if (trimmed.endsWith('pt')) return num * (96 / 72);
    if (trimmed.endsWith('in')) return num * 96;
    if (trimmed.endsWith('mm')) return num * (96 / 25.4);
    if (trimmed.endsWith('cm')) return num * (96 / 2.54);
    if (trimmed.endsWith('em') || trimmed.endsWith('rem')) return num * 16;
    return num;
  }

  /**
   * Parse SVG string and extract metadata
   */
  public parseSvg(svgText: string, fileName: string = 'graphic.svg', fileSize: number = 0): SvgMetadata {
    const doc = this.parser.parseFromString(svgText, 'image/svg+xml');
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid SVG file format: XML parsing failed.');
    }

    const svgEl = doc.querySelector('svg');
    if (!svgEl) {
      throw new Error('No <svg> root element found in file.');
    }

    let width = 0;
    let height = 0;
    const rawWidth = svgEl.getAttribute('width');
    const rawHeight = svgEl.getAttribute('height');
    const rawViewBox = svgEl.getAttribute('viewBox');

    // Parse viewBox if present
    let vbWidth = 0;
    let vbHeight = 0;
    if (rawViewBox) {
      const parts = rawViewBox.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        vbWidth = parts[2];
        vbHeight = parts[3];
      }
    }

    if (rawWidth && rawHeight && !rawWidth.includes('%') && !rawHeight.includes('%')) {
      width = this.parseUnitToPx(rawWidth, vbWidth || 300);
      height = this.parseUnitToPx(rawHeight, vbHeight || 300);
    } else if (vbWidth > 0 && vbHeight > 0) {
      width = vbWidth;
      height = vbHeight;
    } else {
      width = 300;
      height = 300;
    }

    // Ensure viewBox exists so scalable vector resizing behaves properly
    if (!rawViewBox) {
      svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }

    // Ensure xmlns is present
    if (!svgEl.getAttribute('xmlns')) {
      svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }

    this.parsedDoc = doc;
    const aspectRatio = width > 0 && height > 0 ? width / height : 1;

    this.metadata = {
      originalWidth: Math.round(width),
      originalHeight: Math.round(height),
      originalViewBox: rawViewBox || `0 0 ${width} ${height}`,
      aspectRatio,
      fileSize: fileSize || new Blob([svgText]).size,
      fileName,
      rawSvgText: svgText,
      hasViewBox: !!rawViewBox,
    };

    return this.metadata;
  }

  /**
   * Generate resized SVG string based on current options
   */
  public generateResizedSvg(opts: { width: number; height: number; preserveAspectRatio?: string }): string {
    if (!this.parsedDoc || !this.metadata) {
      throw new Error('No SVG loaded to resize.');
    }

    // Clone doc to avoid mutating base
    const cloneDoc = this.parsedDoc.cloneNode(true) as Document;
    const svgEl = cloneDoc.querySelector('svg');
    if (!svgEl) throw new Error('Root SVG missing.');

    const targetWidth = Math.max(1, Math.round(opts.width));
    const targetHeight = Math.max(1, Math.round(opts.height));

    svgEl.setAttribute('width', `${targetWidth}`);
    svgEl.setAttribute('height', `${targetHeight}`);

    if (opts.preserveAspectRatio) {
      svgEl.setAttribute('preserveAspectRatio', opts.preserveAspectRatio);
    }

    return this.serializer.serializeToString(cloneDoc);
  }

  /**
   * Render resized SVG onto a canvas for PNG/WebP export or raster preview
   */
  public renderToCanvas(
    svgString: string,
    width: number,
    height: number,
    backgroundColor: string = 'transparent'
  ): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const targetWidth = Math.max(1, Math.round(width));
      const targetHeight = Math.max(1, Math.round(height));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable.'));
        return;
      }

      if (backgroundColor && backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      } else {
        ctx.clearRect(0, 0, targetWidth, targetHeight);
      }

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to render SVG onto canvas.'));
      };

      img.src = url;
    });
  }

  /**
   * Export resized file as Blob
   */
  public async exportFile(
    svgString: string,
    opts: { width: number; height: number; format: 'svg' | 'png' | 'webp' | 'jpeg'; quality?: number; backgroundColor?: string }
  ): Promise<{ blob: Blob; extension: string; mimeType: string }> {
    if (opts.format === 'svg') {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      return { blob, extension: 'svg', mimeType: 'image/svg+xml' };
    }

    const canvas = await this.renderToCanvas(svgString, opts.width, opts.height, opts.backgroundColor || 'transparent');
    const mime = opts.format === 'png' ? 'image/png' : opts.format === 'webp' ? 'image/webp' : 'image/jpeg';
    const quality = opts.quality !== undefined ? opts.quality : 0.95;

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to generate image blob.'));
            return;
          }
          resolve({ blob, extension: opts.format === 'jpeg' ? 'jpg' : opts.format, mimeType: mime });
        },
        mime,
        quality
      );
    });
  }

  /**
   * Procedurally generate a stylish sample SVG for instant testing
   */
  public generateSampleSvg(): { svgText: string; fileName: string } {
    const sample = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="50%" stop-color="#06B6D4" />
      <stop offset="100%" stop-color="#10B981" />
    </linearGradient>
    <linearGradient id="grad2" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F43F5E" />
      <stop offset="100%" stop-color="#FB923C" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-opacity="0.25" />
    </filter>
  </defs>

  <rect width="100%" height="100%" rx="24" fill="#0F172A" />

  <!-- Background Decorative Grid -->
  <g stroke="#1E293B" stroke-width="1.5" opacity="0.6">
    <line x1="100" y1="0" x2="100" y2="600" />
    <line x1="200" y1="0" x2="200" y2="600" />
    <line x1="300" y1="0" x2="300" y2="600" />
    <line x1="400" y1="0" x2="400" y2="600" />
    <line x1="500" y1="0" x2="500" y2="600" />
    <line x1="600" y1="0" x2="600" y2="600" />
    <line x1="700" y1="0" x2="700" y2="600" />
    <line x1="0" y1="100" x2="800" y2="100" />
    <line x1="0" y1="200" x2="800" y2="200" />
    <line x1="0" y1="300" x2="800" y2="300" />
    <line x1="0" y1="400" x2="800" y2="400" />
    <line x1="0" y1="500" x2="800" y2="500" />
  </g>

  <!-- Geometric Modern Icon Elements -->
  <g filter="url(#shadow)" transform="translate(400, 270)">
    <circle r="140" fill="url(#grad1)" />
    <polygon points="0,-90 78,45 -78,45" fill="#FFFFFF" opacity="0.95" />
    <circle cx="0" cy="15" r="32" fill="url(#grad2)" />
  </g>

  <!-- Typography -->
  <text x="400" y="480" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
    VECTOR SCALE MASTER
  </text>
  <text x="400" y="520" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#94A3B8" text-anchor="middle" letter-spacing="0.5">
    Infinite Scalability • Zero Quality Loss • ImgFeel
  </text>
</svg>`;
    return { svgText: sample, fileName: 'vector-badge-demo.svg' };
  }
}
