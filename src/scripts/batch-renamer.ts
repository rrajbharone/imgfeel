/**
 * Client-Side Engine for Batch Rename Images Online
 * 100% in-browser processing with zero server uploads and lossless byte preservation.
 */

export interface ImageItem {
  id: string;
  file: File;
  originalName: string;
  baseName: string;
  extension: string;
  sizeBytes: number;
  width: number;
  height: number;
  thumbnailUrl: string;
  newName: string;
}

export class BatchRenamerEngine {
  /**
   * Inspect an uploaded File and build an ImageItem
   */
  static async inspectImageFile(file: File): Promise<ImageItem> {
    const id = 'img_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    const originalName = file.name;
    const lastDot = originalName.lastIndexOf('.');
    let baseName = originalName;
    let extension = '';

    if (lastDot > 0) {
      baseName = originalName.substring(0, lastDot);
      extension = originalName.substring(lastDot + 1).toLowerCase();
    }

    const thumbnailUrl = URL.createObjectURL(file);
    const dims = await this.getImageDimensions(thumbnailUrl);

    return {
      id,
      file,
      originalName,
      baseName,
      extension,
      sizeBytes: file.size,
      width: dims.width,
      height: dims.height,
      thumbnailUrl,
      newName: originalName,
    };
  }

  /**
   * Read natural dimensions from an image URL
   */
  private static getImageDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth || 0, height: img.naturalHeight || 0 });
      img.onerror = () => resolve({ width: 0, height: 0 });
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
   * Create in-memory PKZIP archive from ImageItem list without external dependencies
   */
  static async createRenamedZip(
    items: ImageItem[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Blob> {
    const filesToZip: { name: string; data: Uint8Array }[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const buffer = await item.file.arrayBuffer();
      filesToZip.push({
        name: item.newName || item.originalName,
        data: new Uint8Array(buffer),
      });

      if (onProgress) {
        onProgress(i + 1, items.length);
      }
    }

    return this.createZipArchive(filesToZip);
  }

  /**
   * Pure TypeScript in-memory standard PKZIP builder
   */
  private static createZipArchive(files: { name: string; data: Uint8Array }[]): Blob {
    const textEncoder = new TextEncoder();
    const localHeaders: Uint8Array[] = [];
    const centralHeaders: Uint8Array[] = [];
    let offset = 0;

    for (const file of files) {
      const nameBytes = textEncoder.encode(file.name);
      const crc = this.crc32(file.data);
      const size = file.data.length;

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
      localHeaders.push(file.data);

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
      offset += localHeader.length + file.data.length;
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
    ev.setUint16(8, files.length, true); // Number of central directory records on this disk
    ev.setUint16(10, files.length, true); // Total number of central directory records
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
   * Generate 4 demo sample photos on HTML Canvas for testing
   */
  static async generateSampleBatch(): Promise<File[]> {
    const samples = [
      { name: 'IMG_20260824_104218.jpg', color: '#3b82f6', label: 'Beach Sunset' },
      { name: 'DSC_0042.PNG', color: '#10b981', label: 'Mountain Trail' },
      { name: 'Screenshot 2026-08-25 at 4.12.33 PM.png', color: '#f59e0b', label: 'Product Mockup' },
      { name: 'Photo_Scan_0088.webp', color: '#8b5cf6', label: 'Family Reunion' },
    ];

    const files: File[] = [];

    for (const s of samples) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 400, 300);
        grad.addColorStop(0, s.color);
        grad.addColorStop(1, '#1e293b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 300);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.label, 200, 140);

        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(s.name, 200, 175);

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
        if (blob) {
          files.push(new File([blob], s.name, { type: 'image/jpeg' }));
        }
      }
    }

    return files;
  }
}
