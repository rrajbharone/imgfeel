/**
 * Client-Side Engine for Image Splitter Online
 * 100% in-browser processing with zero server uploads, pixel-accurate slicing, and instant ZIP downloads.
 */

export interface SplitSlice {
  id: string;
  index: number;
  row: number;
  col: number;
  totalRows: number;
  totalCols: number;
  width: number;
  height: number;
  blob: Blob;
  url: string;
  fileName: string;
  sizeBytes: number;
  formattedSize: string;
}

export interface SplitOptions {
  mode: 'grid' | 'rows' | 'cols';
  rows: number;
  cols: number;
  format: 'original' | 'png' | 'jpeg' | 'webp';
  quality: number; // 0.1 - 1.0
  namingPattern: 'row_col' | 'part_number' | 'grid_order';
}

export interface ImageMetadata {
  file?: File;
  name: string;
  baseName: string;
  extension: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  aspectRatio: number;
  previewUrl: string;
}

export class ImageSplitterEngine {
  /**
   * Inspect an uploaded image File and return its metadata and preview URL
   */
  static async inspectFile(file: File): Promise<ImageMetadata> {
    const originalName = file.name;
    const lastDot = originalName.lastIndexOf('.');
    let baseName = originalName;
    let extension = 'png';

    if (lastDot > 0) {
      baseName = originalName.substring(0, lastDot);
      extension = originalName.substring(lastDot + 1).toLowerCase();
    }

    const previewUrl = URL.createObjectURL(file);
    const dims = await this.loadImageDimensions(previewUrl);

    return {
      file,
      name: originalName,
      baseName,
      extension: extension === 'jpg' ? 'jpeg' : extension,
      mimeType: file.type || 'image/png',
      sizeBytes: file.size,
      width: dims.width,
      height: dims.height,
      aspectRatio: dims.width > 0 && dims.height > 0 ? dims.width / dims.height : 1,
      previewUrl,
    };
  }

  /**
   * Load natural dimensions of an image
   */
  private static loadImageDimensions(url: string): Promise<{ width: number; height: number; img: HTMLImageElement }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        resolve({
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
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
   * Calculate exact slice coordinates with zero gaps and zero pixel loss
   */
  static calculateSlices(
    totalWidth: number,
    totalHeight: number,
    rows: number,
    cols: number
  ): { row: number; col: number; x: number; y: number; width: number; height: number }[] {
    const slices: { row: number; col: number; x: number; y: number; width: number; height: number }[] = [];

    const rowBoundaries: number[] = [0];
    for (let r = 1; r <= rows; r++) {
      rowBoundaries.push(Math.round((r * totalHeight) / rows));
    }

    const colBoundaries: number[] = [0];
    for (let c = 1; c <= cols; c++) {
      colBoundaries.push(Math.round((c * totalWidth) / cols));
    }

    for (let r = 0; r < rows; r++) {
      const y = rowBoundaries[r];
      const sliceH = rowBoundaries[r + 1] - y;

      for (let c = 0; c < cols; c++) {
        const x = colBoundaries[c];
        const sliceW = colBoundaries[c + 1] - x;

        slices.push({
          row: r + 1,
          col: c + 1,
          x,
          y,
          width: sliceW,
          height: sliceH,
        });
      }
    }

    return slices;
  }

  /**
   * Perform image splitting and generate slice blobs
   */
  static async splitImage(
    sourceUrl: string,
    metadata: ImageMetadata,
    options: SplitOptions,
    onProgress?: (completed: number, total: number) => void
  ): Promise<SplitSlice[]> {
    const { img, width: totalWidth, height: totalHeight } = await this.loadImageDimensions(sourceUrl);

    let effectiveRows = options.rows;
    let effectiveCols = options.cols;

    if (options.mode === 'rows') {
      effectiveCols = 1;
    } else if (options.mode === 'cols') {
      effectiveRows = 1;
    }

    effectiveRows = Math.max(1, Math.min(30, effectiveRows));
    effectiveCols = Math.max(1, Math.min(30, effectiveCols));

    const sliceCoords = this.calculateSlices(totalWidth, totalHeight, effectiveRows, effectiveCols);
    const totalSlices = sliceCoords.length;

    // Determine target format & MIME
    let targetMime = 'image/png';
    let targetExt = 'png';

    if (options.format === 'original') {
      if (metadata.mimeType === 'image/jpeg' || metadata.mimeType === 'image/jpg') {
        targetMime = 'image/jpeg';
        targetExt = 'jpg';
      } else if (metadata.mimeType === 'image/webp') {
        targetMime = 'image/webp';
        targetExt = 'webp';
      } else {
        targetMime = 'image/png';
        targetExt = 'png';
      }
    } else if (options.format === 'jpeg') {
      targetMime = 'image/jpeg';
      targetExt = 'jpg';
    } else if (options.format === 'webp') {
      targetMime = 'image/webp';
      targetExt = 'webp';
    } else {
      targetMime = 'image/png';
      targetExt = 'png';
    }

    const results: SplitSlice[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: false });

    if (!ctx) {
      throw new Error('Canvas 2D context could not be created');
    }

    const padNumber = (n: number, max: number) => {
      const len = max.toString().length;
      return n.toString().padStart(len, '0');
    };

    for (let i = 0; i < totalSlices; i++) {
      const item = sliceCoords[i];
      canvas.width = item.width;
      canvas.height = item.height;

      ctx.clearRect(0, 0, item.width, item.height);

      // If exporting to JPEG, fill white background for transparent source images
      if (targetMime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, item.width, item.height);
      }

      ctx.drawImage(
        img,
        item.x,
        item.y,
        item.width,
        item.height,
        0,
        0,
        item.width,
        item.height
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to generate slice blob'));
          },
          targetMime,
          options.quality
        );
      });

      const url = URL.createObjectURL(blob);
      let fileName = '';

      if (options.namingPattern === 'part_number') {
        fileName = `${metadata.baseName}_part_${padNumber(i + 1, totalSlices)}.${targetExt}`;
      } else if (options.namingPattern === 'grid_order') {
        fileName = `${metadata.baseName}_grid_${item.row}x${item.col}.${targetExt}`;
      } else {
        if (effectiveRows > 1 && effectiveCols > 1) {
          fileName = `${metadata.baseName}_r${item.row}_c${item.col}.${targetExt}`;
        } else if (effectiveRows > 1) {
          fileName = `${metadata.baseName}_row_${padNumber(item.row, effectiveRows)}.${targetExt}`;
        } else {
          fileName = `${metadata.baseName}_col_${padNumber(item.col, effectiveCols)}.${targetExt}`;
        }
      }

      results.push({
        id: `slice_${i + 1}_${Math.random().toString(36).substring(2, 7)}`,
        index: i + 1,
        row: item.row,
        col: item.col,
        totalRows: effectiveRows,
        totalCols: effectiveCols,
        width: item.width,
        height: item.height,
        blob,
        url,
        fileName,
        sizeBytes: blob.size,
        formattedSize: this.formatBytes(blob.size),
      });

      if (onProgress) {
        onProgress(i + 1, totalSlices);
      }
    }

    return results;
  }

  /**
   * Create an in-memory PKZIP archive from all split slices with zero external dependencies
   */
  static async createZipArchive(
    slices: SplitSlice[],
    zipBaseName = 'split_images'
  ): Promise<Blob> {
    const textEncoder = new TextEncoder();
    const localHeaders: Uint8Array[] = [];
    const centralHeaders: Uint8Array[] = [];
    let offset = 0;

    for (const slice of slices) {
      const buffer = await slice.blob.arrayBuffer();
      const fileData = new Uint8Array(buffer);
      const nameBytes = textEncoder.encode(slice.fileName);
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
    ev.setUint16(8, slices.length, true); // Number of central directory records on this disk
    ev.setUint16(10, slices.length, true); // Total number of central directory records
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
   * Generate an ultra-crisp 1200x1200 sample image on HTML Canvas for testing
   */
  static async generateSampleImage(): Promise<File> {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to create sample canvas');
    }

    // Rich background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 1200);
    bgGrad.addColorStop(0, '#3b82f6');
    bgGrad.addColorStop(0.35, '#6366f1');
    bgGrad.addColorStop(0.7, '#8b5cf6');
    bgGrad.addColorStop(1, '#ec4899');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 1200);

    // Subtle 3x3 quadrant background boxes with rounded corners
    const colors = [
      'rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.12)',
      'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.18)', 'rgba(255, 255, 255, 0.08)',
      'rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.12)',
    ];

    const labels = [
      'Top Left • 1', 'Top Center • 2', 'Top Right • 3',
      'Mid Left • 4', 'Center Focal • 5', 'Mid Right • 6',
      'Bottom Left • 7', 'Bottom Center • 8', 'Bottom Right • 9'
    ];

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const idx = r * 3 + c;
        const x = c * 400 + 16;
        const y = r * 400 + 16;
        const w = 368;
        const h = 368;

        ctx.fillStyle = colors[idx];
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 20);
        ctx.fill();

        // Decorative inner glow outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Section label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labels[idx], c * 400 + 200, r * 400 + 200);

        // Subtext coordinates
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px Inter, system-ui, sans-serif';
        ctx.fillText(`Row ${r + 1}, Col ${c + 1} (400×400 px)`, c * 400 + 200, r * 400 + 235);
      }
    }

    // Center focal decorative star/circle badge
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(600, 600, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 36px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✂️', 600, 600);

    // Big title banner at top
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.beginPath();
    ctx.roundRect(300, 60, 600, 60, 30);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Inter, system-ui, sans-serif';
    ctx.fillText('ImgFeel • Image Splitter Sample (1200 × 1200 px)', 600, 90);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
    if (!blob) {
      throw new Error('Failed to generate sample JPEG');
    }

    return new File([blob], 'sample-grid-photo.jpg', { type: 'image/jpeg' });
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
   * Helper to revoke all slice Object URLs when cleaning up
   */
  static cleanupSlices(slices: SplitSlice[]): void {
    for (const s of slices) {
      if (s.url && s.url.startsWith('blob:')) {
        URL.revokeObjectURL(s.url);
      }
    }
  }
}
