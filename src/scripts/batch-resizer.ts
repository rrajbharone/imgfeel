/**
 * Client-Side Engine for "Resize Multiple Images at Once" Online
 * 100% in-browser processing with zero server uploads, high-quality Canvas rendering, and in-memory ZIP generation.
 */

export interface BatchImageItem {
  id: string;
  file: File;
  name: string;
  baseName: string;
  extension: string;
  mimeType: string;
  originalWidth: number;
  originalHeight: number;
  originalSizeBytes: number;
  formattedOriginalSize: string;
  thumbnailUrl: string;
  targetWidth: number;
  targetHeight: number;
  isResized: boolean;
  resizedBlob?: Blob;
  resizedUrl?: string;
  resizedSizeBytes?: number;
  formattedResizedSize?: string;
}

export interface BatchResizeOptions {
  mode: 'dimensions' | 'percentage';
  width: number;
  height: number;
  lockAspectRatio: boolean;
  percentage?: number; // e.g. 50
  quality: number; // 0.1 - 1.0
  targetSizeValue?: number; // e.g. 500
  targetSizeUnit?: 'KB' | 'MB'; // 'KB' | 'MB'
}

export class BatchResizerEngine {
  /**
   * Inspect an uploaded File and create a BatchImageItem
   */
  static async inspectFile(file: File): Promise<BatchImageItem> {
    const id = 'img_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    const originalName = file.name;
    const lastDot = originalName.lastIndexOf('.');
    let baseName = originalName;
    let extension = 'jpg';

    if (lastDot > 0) {
      baseName = originalName.substring(0, lastDot);
      extension = originalName.substring(lastDot + 1).toLowerCase();
    }

    const thumbnailUrl = URL.createObjectURL(file);
    const dims = await this.getImageDimensions(thumbnailUrl);

    return {
      id,
      file,
      name: originalName,
      baseName,
      extension: extension === 'jpeg' ? 'jpg' : extension,
      mimeType: file.type || 'image/jpeg',
      originalWidth: dims.width,
      originalHeight: dims.height,
      originalSizeBytes: file.size,
      formattedOriginalSize: this.formatBytes(file.size),
      thumbnailUrl,
      targetWidth: dims.width,
      targetHeight: dims.height,
      isResized: false,
    };
  }

  /**
   * Inspect multiple files concurrently
   */
  static async inspectFiles(files: FileList | File[]): Promise<BatchImageItem[]> {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|bmp|gif|svg)$/i.test(f.name));
    const items: BatchImageItem[] = [];

    for (const f of validFiles) {
      try {
        const item = await this.inspectFile(f);
        items.push(item);
      } catch (err) {
        console.warn(`Failed to inspect file ${f.name}`, err);
      }
    }

    return items;
  }

  /**
   * Read natural dimensions from an image URL
   */
  private static getImageDimensions(url: string): Promise<{ width: number; height: number; img: HTMLImageElement }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        resolve({
          width: img.naturalWidth || img.width || 800,
          height: img.naturalHeight || img.height || 600,
          img,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }

  /**
   * Format bytes to human readable string
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Calculate target dimensions for a specific item given the batch resize options
   */
  static calculateTargetDimensions(item: BatchImageItem, options: BatchResizeOptions): { width: number; height: number } {
    if (options.mode === 'percentage' && options.percentage) {
      const scale = Math.max(0.01, Math.min(5.0, options.percentage / 100));
      return {
        width: Math.max(1, Math.round(item.originalWidth * scale)),
        height: Math.max(1, Math.round(item.originalHeight * scale)),
      };
    }

    // Dimension Mode
    let targetW = options.width || item.originalWidth;
    let targetH = options.height || item.originalHeight;

    if (options.lockAspectRatio) {
      const itemRatio = item.originalWidth / item.originalHeight;
      // If width was explicitly provided or prioritized, compute proportional height
      targetH = Math.max(1, Math.round(targetW / itemRatio));
    }

    return {
      width: Math.max(1, targetW),
      height: Math.max(1, targetH),
    };
  }

  /**
   * Optimize image encoding to achieve target file size in bytes
   */
  static async optimizeToTargetSize(
    img: HTMLImageElement,
    initialW: number,
    initialH: number,
    mimeType: string,
    targetBytes: number
  ): Promise<{ blob: Blob; width: number; height: number }> {
    const encode = (scale: number, quality: number): Promise<{ blob: Blob; width: number; height: number }> => {
      const width = Math.max(1, Math.round(initialW * scale));
      const height = Math.max(1, Math.round(initialH * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve({ blob: b, width, height });
            else reject(new Error('Failed to create blob in target size search'));
          },
          mimeType,
          mimeType !== 'image/png' ? quality : undefined
        );
      });
    };

    // PNG Handling (dimension scale binary search)
    if (mimeType === 'image/png') {
      let minScale = 0.05;
      let maxScale = 1.0;
      let bestResult: { blob: Blob; width: number; height: number } | null = null;
      let closestResult: { blob: Blob; width: number; height: number } | null = null;

      for (let i = 0; i < 7; i++) {
        const midScale = (minScale + maxScale) / 2;
        const res = await encode(midScale, 1.0);
        closestResult = res;

        if (res.blob.size <= targetBytes) {
          bestResult = res;
          minScale = midScale;
        } else {
          maxScale = midScale;
        }
      }

      return bestResult ?? closestResult!;
    }

    // JPEG / WebP / AVIF (Quality tuning + scale tuning if needed)
    const minQRes = await encode(1.0, 0.05);

    if (minQRes.blob.size <= targetBytes) {
      let minQ = 0.05;
      let maxQ = 0.98;
      let bestRes = minQRes;

      for (let i = 0; i < 8; i++) {
        const midQ = (minQ + maxQ) / 2;
        const res = await encode(1.0, midQ);
        if (res.blob.size <= targetBytes) {
          bestRes = res;
          minQ = midQ;
        } else {
          maxQ = midQ;
        }
      }
      return bestRes;
    }

    // Downscale needed
    let minScale = 0.05;
    let maxScale = 1.0;
    let bestScale = 0.05;

    for (let i = 0; i < 6; i++) {
      const midScale = (minScale + maxScale) / 2;
      const res = await encode(midScale, 0.60);
      if (res.blob.size <= targetBytes) {
        bestScale = midScale;
        minScale = midScale;
      } else {
        maxScale = midScale;
      }
    }

    // Fine-tune quality at best scale
    let minQ = 0.05;
    let maxQ = 0.95;
    let finalRes = await encode(bestScale, 0.60);

    for (let i = 0; i < 6; i++) {
      const midQ = (minQ + maxQ) / 2;
      const res = await encode(bestScale, midQ);
      if (res.blob.size <= targetBytes) {
        finalRes = res;
        minQ = midQ;
      } else {
        maxQ = midQ;
      }
    }

    return finalRes;
  }

  /**
   * Resize a single image item onto an HTML Canvas with high smoothing quality
   */
  static async resizeSingle(item: BatchImageItem, options: BatchResizeOptions): Promise<BatchImageItem> {
    const { img } = await this.getImageDimensions(item.thumbnailUrl);
    const { width: initialW, height: initialH } = this.calculateTargetDimensions(item, options);

    let targetMime = item.mimeType;
    let finalW = initialW;
    let finalH = initialH;
    let blob: Blob;

    // Check if target file size is set
    if (options.targetSizeValue && options.targetSizeValue > 0) {
      const targetBytes = options.targetSizeUnit === 'MB'
        ? options.targetSizeValue * 1024 * 1024
        : options.targetSizeValue * 1024;

      const optResult = await this.optimizeToTargetSize(img, initialW, initialH, targetMime, targetBytes);
      finalW = optResult.width;
      finalH = optResult.height;
      blob = optResult.blob;
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = finalW;
      canvas.height = finalH;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D context could not be created');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Handle white background for JPEG exports if source has transparent alpha
      if (targetMime === 'image/jpeg' || targetMime === 'image/jpg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, finalW, finalH);
      }

      ctx.drawImage(img, 0, 0, finalW, finalH);

      blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to generate resized blob'));
          },
          targetMime,
          options.quality || 0.92
        );
      });
    }

    if (item.resizedUrl) {
      URL.revokeObjectURL(item.resizedUrl);
    }

    const resizedUrl = URL.createObjectURL(blob);

    return {
      ...item,
      targetWidth: finalW,
      targetHeight: finalH,
      isResized: true,
      resizedBlob: blob,
      resizedUrl,
      resizedSizeBytes: blob.size,
      formattedResizedSize: this.formatBytes(blob.size),
    };
  }

  /**
   * Resize all images in batch with progress notifications
   */
  static async resizeBatch(
    items: BatchImageItem[],
    options: BatchResizeOptions,
    onProgress?: (current: number, total: number) => void
  ): Promise<BatchImageItem[]> {
    const updatedItems: BatchImageItem[] = [];

    for (let i = 0; i < items.length; i++) {
      const resized = await this.resizeSingle(items[i], options);
      updatedItems.push(resized);
      if (onProgress) {
        onProgress(i + 1, items.length);
      }
    }

    return updatedItems;
  }

  /**
   * Create an in-memory PKZIP archive from all resized items with zero external dependencies
   */
  static async createZipArchive(
    items: BatchImageItem[],
    zipBaseName = 'resized_images'
  ): Promise<Blob> {
    const textEncoder = new TextEncoder();
    const localHeaders: Uint8Array[] = [];
    const centralHeaders: Uint8Array[] = [];
    let offset = 0;

    const filesToZip: { name: string; blob: Blob }[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const blob = item.resizedBlob || item.file;
      const fileName = item.name.replace(/\.[^/.]+$/, '') + `_resized_${item.targetWidth}x${item.targetHeight}.${item.extension}`;
      filesToZip.push({ name: fileName, blob });
    }

    for (const file of filesToZip) {
      const buffer = await file.blob.arrayBuffer();
      const fileData = new Uint8Array(buffer);
      const nameBytes = textEncoder.encode(file.name);
      const crc = this.crc32(fileData);
      const size = fileData.length;

      // Local file header (30 bytes + filename)
      const localHeader = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(localHeader.buffer);

      lv.setUint32(0, 0x04034b50, true); // Local file header signature
      lv.setUint16(4, 20, true); // Version needed to extract (2.0)
      lv.setUint16(6, 0x0800, true); // General purpose bit flag (UTF-8)
      lv.setUint16(8, 0, true); // Compression method (0 = uncompressed store)
      lv.setUint16(10, 0, true); // File last mod time
      lv.setUint16(12, 0, true); // File last mod date
      lv.setUint32(14, crc, true); // CRC-32
      lv.setUint32(18, size, true); // Compressed size
      lv.setUint32(22, size, true); // Uncompressed size
      lv.setUint16(26, nameBytes.length, true); // File name length
      lv.setUint16(28, 0, true); // Extra field length
      localHeader.set(nameBytes, 30);

      localHeaders.push(localHeader);
      localHeaders.push(fileData);

      // Central directory file header (46 bytes + filename)
      const centralHeader = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(centralHeader.buffer);

      cv.setUint32(0, 0x02014b50, true); // Central directory header signature
      cv.setUint16(4, 20, true); // Version made by
      cv.setUint16(6, 20, true); // Version needed to extract
      cv.setUint16(8, 0x0800, true); // General purpose bit flag (UTF-8)
      cv.setUint16(10, 0, true); // Compression method
      cv.setUint16(12, 0, true); // Mod time
      cv.setUint16(14, 0, true); // Mod date
      cv.setUint32(16, crc, true); // CRC-32
      cv.setUint32(20, size, true); // Compressed size
      cv.setUint32(24, size, true); // Uncompressed size
      cv.setUint16(28, nameBytes.length, true); // File name length
      cv.setUint16(30, 0, true); // Extra field length
      cv.setUint16(32, 0, true); // File comment length
      cv.setUint16(34, 0, true); // Disk number start
      cv.setUint16(36, 0, true); // Internal file attributes
      cv.setUint32(38, 0, true); // External file attributes
      cv.setUint32(42, offset, true); // Relative offset of local header
      centralHeader.set(nameBytes, 46);

      centralHeaders.push(centralHeader);
      offset += localHeader.length + fileData.length;
    }

    const centralDirectoryOffset = offset;
    let centralDirectorySize = 0;
    for (const ch of centralHeaders) {
      centralDirectorySize += ch.length;
    }

    // End of central directory record (22 bytes)
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);

    ev.setUint32(0, 0x06054b50, true); // EOCD signature
    ev.setUint16(4, 0, true); // Number of this disk
    ev.setUint16(6, 0, true); // Disk where central directory starts
    ev.setUint16(8, filesToZip.length, true); // Number of central directory records on this disk
    ev.setUint16(10, filesToZip.length, true); // Total number of central directory records
    ev.setUint32(12, centralDirectorySize, true); // Size of central directory
    ev.setUint32(16, centralDirectoryOffset, true); // Offset of start of central directory
    ev.setUint16(20, 0, true); // Comment length

    const allParts: (Uint8Array | BlobPart)[] = [...localHeaders, ...centralHeaders, eocd];
    return new Blob(allParts, { type: 'application/zip' });
  }

  /**
   * Fast CRC32 checksum calculator
   */
  private static crc32(data: Uint8Array): number {
    let crc = 0 ^ -1;
    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ this.crc32Table[(crc ^ data[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  private static crc32Table: Uint32Array = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c;
    }
    return table;
  })();

  /**
   * Generate 4 crisp demo sample photos on HTML Canvas for testing
   */
  static async generateSampleBatch(): Promise<File[]> {
    const samples = [
      { name: 'landscape_sunset.jpg', w: 1920, h: 1080, color1: '#f97316', color2: '#1e1b4b', label: 'Sunset Vista (1920×1080)' },
      { name: 'product_photo.png', w: 1200, h: 1200, color1: '#3b82f6', color2: '#1e293b', label: 'Square Product (1200×1200)' },
      { name: 'portrait_headshot.jpg', w: 800, h: 1200, color1: '#ec4899', color2: '#312e81', label: 'Portrait Model (800×1200)' },
      { name: 'banner_header.webp', w: 1200, h: 630, color1: '#10b981', color2: '#0f172a', label: 'Social OG Banner (1200×630)' },
    ];

    const files: File[] = [];

    for (const s of samples) {
      const canvas = document.createElement('canvas');
      canvas.width = s.w;
      canvas.height = s.h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, s.w, s.h);
        grad.addColorStop(0, s.color1);
        grad.addColorStop(1, s.color2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, s.w, s.h);

        // Border outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = Math.max(4, s.w / 150);
        ctx.strokeRect(20, 20, s.w - 40, s.h - 40);

        // Center text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(24, Math.round(s.w / 25))}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.label, s.w / 2, s.h / 2 - 15);

        ctx.font = `${Math.max(14, Math.round(s.w / 45))}px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(s.name, s.w / 2, s.h / 2 + 25);

        const mime = s.name.endsWith('.png') ? 'image/png' : s.name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, 0.95));
        if (blob) {
          files.push(new File([blob], s.name, { type: mime }));
        }
      }
    }

    return files;
  }

  /**
   * Helper to trigger a direct browser file download
   */
  static downloadFile(url: string, fileName: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Revoke thumbnail and resized Object URLs when removing or resetting
   */
  static cleanup(items: BatchImageItem[]): void {
    for (const item of items) {
      if (item.thumbnailUrl && item.thumbnailUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.thumbnailUrl);
      }
      if (item.resizedUrl && item.resizedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.resizedUrl);
      }
    }
  }
}
