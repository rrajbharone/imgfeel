/**
 * srcset-generator.ts
 * 100% Client-Side Pure TypeScript Responsive Image Srcset & Markup Generator,
 * with Multi-Format Picture Output and In-Memory Batch Resizer / ZIP Exporter.
 */

export interface SrcsetPreset {
  id: string;
  name: string;
  widths: number[];
  description: string;
}

export interface SrcsetOptions {
  descriptorMode: 'width' | 'density'; // 'w' vs 'x'
  widths: number[];
  densities: number[]; // e.g. [1, 2, 3]
  sizesAttribute: string;
  fileNamePattern: string; // e.g. "images/{name}-{w}.{ext}"
  altText: string;
  lazyLoad: boolean;
  asyncDecoding: boolean;
  outputFormat: 'html-img' | 'html-picture' | 'react-jsx';
  exportImageFormat: 'image/webp' | 'image/jpeg' | 'image/png';
  exportQuality: number; // 0.1 to 1.0
}

export const SRCSET_PRESETS: SrcsetPreset[] = [
  {
    id: 'standard-web',
    name: 'Standard Web (480, 768, 1024, 1440)',
    widths: [480, 768, 1024, 1440],
    description: 'Balanced for general website content and blog layouts',
  },
  {
    id: 'mobile-first',
    name: 'Mobile-First (360, 640, 768, 1080)',
    widths: [360, 640, 768, 1080],
    description: 'Optimized for mobile viewports, smartphones, and tablets',
  },
  {
    id: 'hero-banner',
    name: 'Full Hero Banner (640, 1024, 1440, 1920, 2560)',
    widths: [640, 1024, 1440, 1920, 2560],
    description: 'High-resolution edge-to-edge banners and landing page headers',
  },
  {
    id: 'retina-density',
    name: 'Retina Density (1x, 2x, 3x)',
    widths: [400, 800, 1200],
    description: 'Fixed-width avatars, UI icons, and card thumbnails across high-DPI screens',
  },
];

export const SIZES_PRESETS = [
  {
    id: 'full-width',
    name: '100vw (Full Width Hero / Banner)',
    value: '100vw',
  },
  {
    id: 'responsive-grid-3col',
    name: '3-Column Responsive Grid (100vw / 50vw / 33vw)',
    value: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  },
  {
    id: 'responsive-grid-2col',
    name: '2-Column / Sidebar Layout (100vw / 50vw)',
    value: '(max-width: 640px) 100vw, 50vw',
  },
  {
    id: 'contained-container',
    name: 'Max-Width Contained Container (100vw / 1200px)',
    value: '(max-width: 1200px) 100vw, 1200px',
  },
  {
    id: 'custom',
    name: 'Custom sizes attribute...',
    value: '',
  },
];

export class SrcsetGeneratorEngine {
  /**
   * Suggest optimal responsive widths based on the natural width of the image.
   */
  public static suggestWidths(naturalWidth: number): number[] {
    const candidateWidths = [320, 480, 640, 768, 1024, 1280, 1440, 1600, 1920, 2560];
    const filtered = candidateWidths.filter((w) => w < naturalWidth);
    if (filtered.length === 0) {
      return [naturalWidth];
    }
    // Always include natural width as the highest resolution source if not already present
    if (!filtered.includes(naturalWidth) && naturalWidth <= 3840) {
      filtered.push(naturalWidth);
    }
    return filtered;
  }

  /**
   * Format image filename based on user-defined pattern.
   * Pattern replacements:
   * {name} = base filename without extension
   * {w} = target width in pixels
   * {h} = target height in pixels
   * {d} = density (e.g. 1x, 2x)
   * {ext} = file extension (e.g. webp, jpg)
   */
  public static formatFilename(
    pattern: string,
    baseName: string,
    width: number,
    height: number,
    density: number,
    extension: string
  ): string {
    return pattern
      .replace(/{name}/g, baseName)
      .replace(/{w}/g, width.toString())
      .replace(/{h}/g, height.toString())
      .replace(/{d}/g, `${density}x`)
      .replace(/{ext}/g, extension);
  }

  /**
   * Generate Code Snippets (HTML <img>, <picture>, React/JSX)
   */
  public static generateCode(
    naturalWidth: number,
    naturalHeight: number,
    baseName: string,
    fileExtension: string,
    options: SrcsetOptions
  ): string {
    const aspectRatio = naturalWidth / naturalHeight;
    const sortedWidths = [...options.widths].sort((a, b) => a - b);
    const mainWidth = sortedWidths[sortedWidths.length - 1] || naturalWidth;
    const mainHeight = Math.round(mainWidth / aspectRatio);

    const ext = fileExtension.toLowerCase().replace('.', '') || 'webp';

    // Build srcset string
    let srcsetString = '';
    if (options.descriptorMode === 'width') {
      srcsetString = sortedWidths
        .map((w) => {
          const h = Math.round(w / aspectRatio);
          const path = SrcsetGeneratorEngine.formatFilename(options.fileNamePattern, baseName, w, h, 1, ext);
          return `${path} ${w}w`;
        })
        .join(',\n    ');
    } else {
      // Density mode (1x, 2x, 3x)
      const baseW = sortedWidths[0] || naturalWidth;
      srcsetString = [1, 2, 3]
        .map((d) => {
          const w = baseW * d;
          const h = Math.round(w / aspectRatio);
          const path = SrcsetGeneratorEngine.formatFilename(options.fileNamePattern, baseName, w, h, d, ext);
          return `${path} ${d}x`;
        })
        .join(',\n    ');
    }

    const fallbackSrc = SrcsetGeneratorEngine.formatFilename(
      options.fileNamePattern,
      baseName,
      mainWidth,
      mainHeight,
      1,
      ext
    );

    const loadingAttr = options.lazyLoad ? ' loading="lazy"' : '';
    const decodingAttr = options.asyncDecoding ? ' decoding="async"' : '';
    const sizesAttr = options.descriptorMode === 'width' ? `\n  sizes="${options.sizesAttribute}"` : '';

    if (options.outputFormat === 'html-img') {
      return `<img
  src="${fallbackSrc}"
  srcset="
    ${srcsetString}
  "${sizesAttr}
  alt="${options.altText || baseName}"
  width="${mainWidth}"
  height="${mainHeight}"${loadingAttr}${decodingAttr}
/>`;
    }

    if (options.outputFormat === 'html-picture') {
      // Modern <picture> with AVIF, WebP, and standard fallback
      const makeSrcset = (targetExt: string) => {
        return sortedWidths
          .map((w) => {
            const h = Math.round(w / aspectRatio);
            const path = SrcsetGeneratorEngine.formatFilename(options.fileNamePattern, baseName, w, h, 1, targetExt);
            return `${path} ${w}w`;
          })
          .join(', ');
      };

      const avifSrcset = makeSrcset('avif');
      const webpSrcset = makeSrcset('webp');
      const jpgSrcset = makeSrcset('jpg');

      return `<picture>
  <source type="image/avif" srcset="${avifSrcset}"${sizesAttr} />
  <source type="image/webp" srcset="${webpSrcset}"${sizesAttr} />
  <img
    src="${fallbackSrc}"
    srcset="${jpgSrcset}"${sizesAttr}
    alt="${options.altText || baseName}"
    width="${mainWidth}"
    height="${mainHeight}"${loadingAttr}${decodingAttr}
  />
</picture>`;
    }

    // React / JSX
    const loadingProp = options.lazyLoad ? ' loading="lazy"' : '';
    const decodingProp = options.asyncDecoding ? ' decoding="async"' : '';
    const sizesProp = options.descriptorMode === 'width' ? `\n      sizes="${options.sizesAttribute}"` : '';

    return `<img
  src="${fallbackSrc}"
  srcSet="
    ${srcsetString}
  "${sizesProp}
  alt="${options.altText || baseName}"
  width={${mainWidth}}
  height={${mainHeight}}${loadingProp}${decodingProp}
/>`;
  }

  /**
   * In-Browser Batch Image Resizer: Resizes source image to all target widths
   * and packages them into a standalone PKZIP (.zip) archive.
   */
  public static async generateResizedZip(
    sourceImg: HTMLImageElement,
    baseName: string,
    widths: number[],
    format: 'image/webp' | 'image/jpeg' | 'image/png',
    quality: number,
    onProgress?: (current: number, total: number) => void
  ): Promise<Blob> {
    const ext = format === 'image/webp' ? 'webp' : format === 'image/jpeg' ? 'jpg' : 'png';
    const aspectRatio = sourceImg.naturalWidth / sourceImg.naturalHeight;
    const sortedWidths = [...widths].sort((a, b) => a - b);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const zipFiles: { name: string; data: Uint8Array }[] = [];

    for (let i = 0; i < sortedWidths.length; i++) {
      const w = sortedWidths[i];
      const h = Math.round(w / aspectRatio);

      canvas.width = w;
      canvas.height = h;

      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(sourceImg, 0, 0, w, h);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), format, quality);
      });

      const arrayBuffer = await blob.arrayBuffer();
      const filename = `${baseName}-${w}w.${ext}`;
      zipFiles.push({ name: filename, data: new Uint8Array(arrayBuffer) });

      if (onProgress) {
        onProgress(i + 1, sortedWidths.length);
      }
    }

    return SrcsetGeneratorEngine.createZipArchive(zipFiles);
  }

  /**
   * Pure TypeScript in-memory PKZIP archive builder (Zero external dependencies)
   */
  public static createZipArchive(files: { name: string; data: Uint8Array }[]): Blob {
    const fileEntries: {
      nameBytes: Uint8Array;
      data: Uint8Array;
      crc: number;
      offset: number;
    }[] = [];

    let currentOffset = 0;
    const localHeaders: Uint8Array[] = [];

    for (const file of files) {
      const nameBytes = new TextEncoder().encode(file.name);
      const crc = SrcsetGeneratorEngine.crc32(file.data);

      const localHeader = new Uint8Array(30 + nameBytes.length + file.data.length);
      const view = new DataView(localHeader.buffer);

      // Local file header signature: 0x04034b50
      view.setUint32(0, 0x04034b50, true);
      view.setUint16(4, 20, true); // Version needed
      view.setUint16(6, 0, true);  // General purpose bit flag
      view.setUint16(8, 0, true);  // Compression method (0 = Store / Uncompressed)
      view.setUint16(10, 0, true); // File last mod time
      view.setUint16(12, 0, true); // File last mod date
      view.setUint32(14, crc, true); // CRC-32
      view.setUint32(18, file.data.length, true); // Compressed size
      view.setUint32(22, file.data.length, true); // Uncompressed size
      view.setUint16(26, nameBytes.length, true); // Filename length
      view.setUint16(28, 0, true); // Extra field length

      localHeader.set(nameBytes, 30);
      localHeader.set(file.data, 30 + nameBytes.length);

      fileEntries.push({
        nameBytes,
        data: file.data,
        crc,
        offset: currentOffset,
      });

      localHeaders.push(localHeader);
      currentOffset += localHeader.length;
    }

    // Build Central Directory
    const centralDirectoryStart = currentOffset;
    const centralDirectoryHeaders: Uint8Array[] = [];

    for (const entry of fileEntries) {
      const cdHeader = new Uint8Array(46 + entry.nameBytes.length);
      const view = new DataView(cdHeader.buffer);

      // Central directory file header signature: 0x02014b50
      view.setUint32(0, 0x02014b50, true);
      view.setUint16(4, 20, true); // Version made by
      view.setUint16(6, 20, true); // Version needed
      view.setUint16(8, 0, true);  // Bit flag
      view.setUint16(10, 0, true); // Compression method (0 = Store)
      view.setUint16(12, 0, true); // Mod time
      view.setUint16(14, 0, true); // Mod date
      view.setUint32(16, entry.crc, true); // CRC-32
      view.setUint32(20, entry.data.length, true); // Comp size
      view.setUint32(24, entry.data.length, true); // Uncomp size
      view.setUint16(28, entry.nameBytes.length, true); // Filename length
      view.setUint16(30, 0, true); // Extra field length
      view.setUint16(32, 0, true); // File comment length
      view.setUint16(34, 0, true); // Disk number start
      view.setUint16(36, 0, true); // Internal file attributes
      view.setUint32(38, 0, true); // External file attributes
      view.setUint32(42, entry.offset, true); // Relative offset of local header

      cdHeader.set(entry.nameBytes, 46);
      centralDirectoryHeaders.push(cdHeader);
      currentOffset += cdHeader.length;
    }

    const centralDirectorySize = currentOffset - centralDirectoryStart;

    // End of Central Directory Record (EOCD)
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);

    // EOCD signature: 0x06054b50
    eocdView.setUint32(0, 0x06054b50, true);
    eocdView.setUint16(4, 0, true); // Number of this disk
    eocdView.setUint16(6, 0, true); // Disk where central directory starts
    eocdView.setUint16(8, files.length, true); // Number of central directory records on this disk
    eocdView.setUint16(10, files.length, true); // Total number of central directory records
    eocdView.setUint32(12, centralDirectorySize, true); // Size of central directory
    eocdView.setUint32(16, centralDirectoryStart, true); // Offset of start of central directory
    eocdView.setUint16(20, 0, true); // Comment length

    return new Blob([...localHeaders, ...centralDirectoryHeaders, eocd], {
      type: 'application/zip',
    });
  }

  /**
   * Fast CRC32 calculation
   */
  public static crc32(data: Uint8Array): number {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
      let byte = data[i];
      for (let j = 0; j < 8; j++) {
        const bit = (crc ^ byte) & 1;
        crc >>>= 1;
        if (bit) crc ^= 0xedb88320;
        byte >>>= 1;
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  /**
   * Generate an in-memory sample scenic landscape image for 1-click testing
   */
  public static async generateSampleImage(): Promise<{ file: File; dataUrl: string }> {
    const width = 1920;
    const height = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // 1. Sky Gradient
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.7);
    sky.addColorStop(0, '#0F172A');
    sky.addColorStop(0.5, '#312E81');
    sky.addColorStop(0.8, '#4F46E5');
    sky.addColorStop(1, '#F43F5E');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // 2. Glowing Sun / Moon
    ctx.fillStyle = '#FEF08A';
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.45, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3. Mountain Ranges
    // Far mountains
    ctx.fillStyle = '#1E1B4B';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.65);
    ctx.lineTo(width * 0.25, height * 0.45);
    ctx.lineTo(width * 0.55, height * 0.62);
    ctx.lineTo(width * 0.8, height * 0.48);
    ctx.lineTo(width, height * 0.68);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Near mountains
    ctx.fillStyle = '#09090B';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.78);
    ctx.lineTo(width * 0.35, height * 0.58);
    ctx.lineTo(width * 0.7, height * 0.75);
    ctx.lineTo(width, height * 0.62);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // 4. Subtle Title Overlay
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Responsive Hero Banner Sample (1920×1080)', width / 2, height * 0.9);

    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92));
    const file = new File([blob], 'responsive-hero-sample.jpg', { type: 'image/jpeg' });
    const dataUrl = URL.createObjectURL(blob);

    return { file, dataUrl };
  }
}
