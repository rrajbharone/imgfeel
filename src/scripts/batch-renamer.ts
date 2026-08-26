/**
 * batch-renamer.ts
 * 100% Client-Side Pure TypeScript Batch Image Renaming & Lossless PKZIP Packaging Engine.
 */

export interface ImageItem {
  id: string;
  file: File | Blob;
  originalName: string;
  baseName: string;
  extension: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  thumbnailUrl: string;
  newName: string;
  customOverride?: string;
}

export type RenameMode = 'pattern' | 'find-replace' | 'prefix-suffix' | 'casing';

export interface RenameOptions {
  mode: RenameMode;
  pattern: string; // e.g. "photo-{00n}" or "{orig}-v2"
  startNumber: number;
  numberPadding: number; // 1 = "1", 2 = "01", 3 = "001", 4 = "0001"
  findText: string;
  replaceText: string;
  isRegex: boolean;
  matchCase: boolean;
  prefix: string;
  suffix: string;
  caseTransformation: 'none' | 'lowercase' | 'uppercase' | 'titlecase';
  spaceReplacement: 'none' | 'hyphen' | 'underscore' | 'remove';
  cleanSpecialChars: boolean;
  lowercaseExtension: boolean;
}

export class BatchRenamerEngine {
  /**
   * Compute new filenames for all images in the batch based on options and conflict resolution.
   */
  public static computeNewNames(items: ImageItem[], options: RenameOptions): ImageItem[] {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS

    const usedNames = new Set<string>();

    return items.map((item, index) => {
      if (item.customOverride && item.customOverride.trim().length > 0) {
        return {
          ...item,
          newName: item.customOverride.trim(),
        };
      }

      let nameWithoutExt = item.baseName;
      const currentSeq = options.startNumber + index;

      if (options.mode === 'pattern') {
        let patternStr = options.pattern || '{orig}-{n}';

        patternStr = patternStr
          .replace(/{orig}/gi, item.baseName)
          .replace(/{original}/gi, item.baseName)
          .replace(/{date}/gi, dateStr)
          .replace(/{time}/gi, timeStr)
          .replace(/{w}/gi, (item.width || 0).toString())
          .replace(/{h}/gi, (item.height || 0).toString());

        // Zero-padding tokens like {00n}, {000n}, or standard {n} / {number}
        patternStr = patternStr.replace(/{0*n}|{number}/gi, (match) => {
          const zeroCount = (match.match(/0/g) || []).length;
          const padLen = Math.max(zeroCount + 1, options.numberPadding);
          return currentSeq.toString().padStart(padLen, '0');
        });

        nameWithoutExt = patternStr;
      } else if (options.mode === 'find-replace') {
        if (options.findText && options.findText.length > 0) {
          try {
            if (options.isRegex) {
              const flags = options.matchCase ? 'g' : 'gi';
              const re = new RegExp(options.findText, flags);
              nameWithoutExt = nameWithoutExt.replace(re, options.replaceText || '');
            } else {
              if (options.matchCase) {
                nameWithoutExt = nameWithoutExt.split(options.findText).join(options.replaceText || '');
              } else {
                const escaped = options.findText.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&');
                const re = new RegExp(escaped, 'gi');
                nameWithoutExt = nameWithoutExt.replace(re, options.replaceText || '');
              }
            }
          } catch {
            // Keep existing if regex invalid
          }
        }
      } else if (options.mode === 'prefix-suffix') {
        nameWithoutExt = `${options.prefix || ''}${nameWithoutExt}${options.suffix || ''}`;
      }

      // Space replacements
      if (options.spaceReplacement === 'hyphen') {
        nameWithoutExt = nameWithoutExt.replace(/\s+/g, '-');
      } else if (options.spaceReplacement === 'underscore') {
        nameWithoutExt = nameWithoutExt.replace(/\s+/g, '_');
      } else if (options.spaceReplacement === 'remove') {
        nameWithoutExt = nameWithoutExt.replace(/\s+/g, '');
      }

      // Clean special characters (sanitizer)
      if (options.cleanSpecialChars) {
        nameWithoutExt = nameWithoutExt.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
      }

      // Case transformation
      if (options.caseTransformation === 'lowercase') {
        nameWithoutExt = nameWithoutExt.toLowerCase();
      } else if (options.caseTransformation === 'uppercase') {
        nameWithoutExt = nameWithoutExt.toUpperCase();
      } else if (options.caseTransformation === 'titlecase') {
        nameWithoutExt = nameWithoutExt.replace(
          /\w\S*/g,
          (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
      }

      // Extension formatting
      let ext = item.extension;
      if (options.lowercaseExtension) {
        ext = ext.toLowerCase();
      }

      let finalFullName = ext ? `${nameWithoutExt}.${ext}` : nameWithoutExt;

      // Conflict Resolution: Prevent duplicates in the batch
      let duplicateCounter = 1;
      const baseForDup = nameWithoutExt;
      while (usedNames.has(finalFullName.toLowerCase())) {
        nameWithoutExt = `${baseForDup}_${duplicateCounter}`;
        finalFullName = ext ? `${nameWithoutExt}.${ext}` : nameWithoutExt;
        duplicateCounter++;
      }

      usedNames.add(finalFullName.toLowerCase());

      return {
        ...item,
        newName: finalFullName,
      };
    });
  }

  /**
   * Helper to format file size in human-readable units.
   */
  public static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Read image dimensions asynchronously.
   */
  public static async getImageDimensions(file: File | Blob): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const dimensions = { width: img.naturalWidth, height: img.naturalHeight };
        URL.revokeObjectURL(url);
        resolve(dimensions);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ width: 0, height: 0 });
      };
      img.src = url;
    });
  }

  /**
   * In-Memory Lossless PKZIP Archiver (Packages original raw bytes without re-encoding).
   */
  public static async createRenamedZip(
    items: ImageItem[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Blob> {
    const files: { name: string; data: Uint8Array }[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const arrayBuffer = await item.file.arrayBuffer();
      files.push({
        name: item.newName,
        data: new Uint8Array(arrayBuffer),
      });

      if (onProgress) {
        onProgress(i + 1, items.length);
      }
    }

    return BatchRenamerEngine.createZipArchive(files);
  }

  /**
   * Pure TypeScript in-memory PKZIP archive builder.
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
      const crc = BatchRenamerEngine.crc32(file.data);

      const localHeader = new Uint8Array(30 + nameBytes.length + file.data.length);
      const view = new DataView(localHeader.buffer);

      view.setUint32(0, 0x04034b50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 0, true);
      view.setUint16(8, 0, true);
      view.setUint16(10, 0, true);
      view.setUint16(12, 0, true);
      view.setUint32(14, crc, true);
      view.setUint32(18, file.data.length, true);
      view.setUint32(22, file.data.length, true);
      view.setUint16(26, nameBytes.length, true);
      view.setUint16(28, 0, true);

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

    const centralDirectoryStart = currentOffset;
    const centralDirectoryHeaders: Uint8Array[] = [];

    for (const entry of fileEntries) {
      const cdHeader = new Uint8Array(46 + entry.nameBytes.length);
      const view = new DataView(cdHeader.buffer);

      view.setUint32(0, 0x02014b50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 20, true);
      view.setUint16(8, 0, true);
      view.setUint16(10, 0, true);
      view.setUint16(12, 0, true);
      view.setUint16(14, 0, true);
      view.setUint32(16, entry.crc, true);
      view.setUint32(20, entry.data.length, true);
      view.setUint32(24, entry.data.length, true);
      view.setUint16(28, entry.nameBytes.length, true);
      view.setUint16(30, 0, true);
      view.setUint16(32, 0, true);
      view.setUint16(34, 0, true);
      view.setUint16(36, 0, true);
      view.setUint32(38, 0, true);
      view.setUint32(42, entry.offset, true);

      cdHeader.set(entry.nameBytes, 46);
      centralDirectoryHeaders.push(cdHeader);
      currentOffset += cdHeader.length;
    }

    const centralDirectorySize = currentOffset - centralDirectoryStart;

    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);

    eocdView.setUint32(0, 0x06054b50, true);
    eocdView.setUint16(4, 0, true);
    eocdView.setUint16(6, 0, true);
    eocdView.setUint16(8, files.length, true);
    eocdView.setUint16(10, files.length, true);
    eocdView.setUint32(12, centralDirectorySize, true);
    eocdView.setUint32(16, centralDirectoryStart, true);
    eocdView.setUint16(20, 0, true);

    return new Blob([...localHeaders, ...centralDirectoryHeaders, eocd], {
      type: 'application/zip',
    });
  }

  /**
   * Fast CRC32 calculation.
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
   * Generate 4 procedural sample photos with messy camera/screenshot filenames for instant testing.
   */
  public static async generateSampleBatch(): Promise<File[]> {
    const samples = [
      { name: 'DSC_0041.jpg', color1: '#3B82F6', color2: '#1D4ED8', label: 'Beach Vacation' },
      { name: 'IMG_20260826_9921.jpg', color1: '#10B981', color2: '#047857', label: 'Mountain Hike' },
      { name: 'screenshot 2026-08-26 at 2.15.42 PM.png', color1: '#8B5CF6', color2: '#6D28D9', label: 'Dashboard UI' },
      { name: 'photo (1).webp', color1: '#F59E0B', color2: '#D97706', label: 'Coffee Cup' },
    ];

    const files: File[] = [];

    for (const s of samples) {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      const ctx = canvas.getContext('2d')!;

      const grad = ctx.createLinearGradient(0, 0, 600, 400);
      grad.addColorStop(0, s.color1);
      grad.addColorStop(1, s.color2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 400);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.label, 300, 200);

      ctx.font = '16px monospace';
      ctx.fillText(s.name, 300, 240);

      const mime = s.name.endsWith('.png') ? 'image/png' : s.name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), mime, 0.9));
      files.push(new File([blob], s.name, { type: mime }));
    }

    return files;
  }
}
