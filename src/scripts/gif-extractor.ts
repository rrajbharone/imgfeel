/**
 * gif-extractor.ts
 * 100% Client-Side Pure TypeScript GIF Decoder, Frame Compositor, and Micro PKZIP Exporter.
 * Zero external dependencies, blazing fast, and 100% private.
 */

export interface GifFrameData {
  index: number;
  delayMs: number;
  timestampMs: number;
  disposalMethod: number;
  canvas: HTMLCanvasElement;
  dataUrl: string;
  width: number;
  height: number;
  blob?: Blob;
}

export interface GifMetadata {
  width: number;
  height: number;
  frameCount: number;
  totalDurationMs: number;
  avgFps: number;
  hasTransparency: boolean;
  loopCount: number; // 0 = infinite
}

export interface GifExtractionResult {
  metadata: GifMetadata;
  frames: GifFrameData[];
}

/**
 * Lightweight in-memory CRC32 table calculator for ZIP archiving
 */
class Crc32 {
  private static table: Uint32Array = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c >>> 0;
    }
    return table;
  })();

  public static calculate(data: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    const table = Crc32.table;
    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
}

/**
 * Micro PKZIP in-memory builder for zero-dependency batch ZIP downloads
 */
export class MicroZip {
  private files: { name: string; data: Uint8Array; crc: number }[] = [];

  public addFile(name: string, data: Uint8Array) {
    const crc = Crc32.calculate(data);
    this.files.push({ name, data, crc });
  }

  public generateZipBlob(): Blob {
    let localHeadersSize = 0;
    let centralDirSize = 0;
    const utf8Encoder = new TextEncoder();

    const encodedFiles = this.files.map(f => {
      const nameBytes = utf8Encoder.encode(f.name);
      const localHeaderSize = 30 + nameBytes.length + f.data.length;
      const centralHeaderSize = 46 + nameBytes.length;
      localHeadersSize += localHeaderSize;
      centralDirSize += centralHeaderSize;
      return { ...f, nameBytes };
    });

    const totalSize = localHeadersSize + centralDirSize + 22;
    const buffer = new Uint8Array(totalSize);
    const view = new DataView(buffer.buffer);

    let offset = 0;
    const localOffsets: number[] = [];

    // 1. Write Local File Headers & File Data
    for (const f of encodedFiles) {
      localOffsets.push(offset);

      // Local file header signature 0x04034b50
      view.setUint32(offset, 0x04034b50, true);
      view.setUint16(offset + 4, 20, true); // Version needed (2.0)
      view.setUint16(offset + 6, 0, true); // General purpose bit flag
      view.setUint16(offset + 8, 0, true); // Compression method (0 = STORE)
      view.setUint16(offset + 10, 0, true); // File last mod time
      view.setUint16(offset + 12, 0, true); // File last mod date
      view.setUint32(offset + 14, f.crc, true); // CRC-32
      view.setUint32(offset + 18, f.data.length, true); // Compressed size
      view.setUint32(offset + 22, f.data.length, true); // Uncompressed size
      view.setUint16(offset + 26, f.nameBytes.length, true); // File name length
      view.setUint16(offset + 28, 0, true); // Extra field length

      offset += 30;
      buffer.set(f.nameBytes, offset);
      offset += f.nameBytes.length;

      buffer.set(f.data, offset);
      offset += f.data.length;
    }

    // 2. Write Central Directory Headers
    const centralDirStart = offset;
    for (let i = 0; i < encodedFiles.length; i++) {
      const f = encodedFiles[i];
      const localOffset = localOffsets[i];

      // Central file header signature 0x02014b50
      view.setUint32(offset, 0x02014b50, true);
      view.setUint16(offset + 4, 20, true); // Version made by
      view.setUint16(offset + 6, 20, true); // Version needed to extract
      view.setUint16(offset + 8, 0, true); // Flags
      view.setUint16(offset + 10, 0, true); // Compression method (0 = STORE)
      view.setUint16(offset + 12, 0, true); // Last mod time
      view.setUint16(offset + 14, 0, true); // Last mod date
      view.setUint32(offset + 16, f.crc, true); // CRC-32
      view.setUint32(offset + 20, f.data.length, true); // Compressed size
      view.setUint32(offset + 24, f.data.length, true); // Uncompressed size
      view.setUint16(offset + 28, f.nameBytes.length, true); // File name length
      view.setUint16(offset + 30, 0, true); // Extra field length
      view.setUint16(offset + 32, 0, true); // Comment length
      view.setUint16(offset + 34, 0, true); // Disk number start
      view.setUint16(offset + 36, 0, true); // Internal file attributes
      view.setUint32(offset + 38, 0, true); // External file attributes
      view.setUint32(offset + 42, localOffset, true); // Relative offset of local header

      offset += 46;
      buffer.set(f.nameBytes, offset);
      offset += f.nameBytes.length;
    }

    // 3. Write End of Central Directory Record
    // EOCD signature 0x06054b50
    view.setUint32(offset, 0x06054b50, true);
    view.setUint16(offset + 4, 0, true); // Disk number
    view.setUint16(offset + 6, 0, true); // Start disk number
    view.setUint16(offset + 8, encodedFiles.length, true); // Records on this disk
    view.setUint16(offset + 10, encodedFiles.length, true); // Total records
    view.setUint32(offset + 12, centralDirSize, true); // Size of central directory
    view.setUint32(offset + 16, centralDirStart, true); // Offset of start of central directory
    view.setUint16(offset + 20, 0, true); // Comment length

    return new Blob([buffer], { type: 'application/zip' });
  }
}

/**
 * GIF Binary Stream Reader & LZW Decompressor
 */
export class GifExtractorEngine {
  /**
   * Parse GIF File and Extract All Frames with Disposal Compositing
   */
  public static async extractFrames(
    file: File | Blob | ArrayBuffer,
    onProgress?: (progress: number, status: string) => void
  ): Promise<GifExtractionResult> {
    onProgress?.(0.1, 'Reading GIF binary data...');
    const buffer = file instanceof ArrayBuffer ? file : await (file as Blob).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // 1. Verify Header
    const signature = String.fromCharCode(...bytes.slice(0, 6));
    if (signature !== 'GIF87a' && signature !== 'GIF89a') {
      throw new Error('Invalid GIF file. File signature is not GIF87a or GIF89a.');
    }

    onProgress?.(0.25, 'Parsing GIF structure & color tables...');
    let pos = 6;

    // Logical Screen Descriptor
    const screenWidth = bytes[pos] | (bytes[pos + 1] << 8);
    const screenHeight = bytes[pos + 2] | (bytes[pos + 3] << 8);
    const packed = bytes[pos + 4];
    const bgIndex = bytes[pos + 5];
    pos += 7;

    const hasGlobalColorTable = (packed & 0x80) !== 0;
    const globalColorTableSize = 1 << ((packed & 0x07) + 1);

    let globalColorTable: Uint8Array | null = null;
    if (hasGlobalColorTable) {
      const gctByteLength = globalColorTableSize * 3;
      globalColorTable = bytes.slice(pos, pos + gctByteLength);
      pos += gctByteLength;
    }

    // Composite State Canvases
    const workingCanvas = document.createElement('canvas');
    workingCanvas.width = screenWidth;
    workingCanvas.height = screenHeight;
    const workingCtx = workingCanvas.getContext('2d', { willReadFrequently: true })!;

    // Backup canvas for disposal method 3 (restore previous)
    const backupCanvas = document.createElement('canvas');
    backupCanvas.width = screenWidth;
    backupCanvas.height = screenHeight;
    const backupCtx = backupCanvas.getContext('2d', { willReadFrequently: true })!;

    const rawFrames: Array<{
      index: number;
      delayMs: number;
      disposalMethod: number;
      transparentIndex: number | null;
      x: number;
      y: number;
      width: number;
      height: number;
      pixels: Uint8Array;
      colorTable: Uint8Array;
    }> = [];

    // Current Graphic Control parameters
    let currentDelayMs = 100;
    let currentDisposal = 0;
    let currentTransparentIndex: number | null = null;
    let loopCount = 0;
    let hasTransparency = false;

    // Parse Blocks
    while (pos < bytes.length) {
      const blockId = bytes[pos++];

      // Trailer (End of GIF)
      if (blockId === 0x3B) {
        break;
      }

      // Extension Introducer
      if (blockId === 0x21) {
        const extType = bytes[pos++];

        // Graphic Control Extension (0xF9)
        if (extType === 0xF9) {
          const blockSize = bytes[pos++];
          const gcePacked = bytes[pos];
          currentDisposal = (gcePacked >> 2) & 0x07;
          const transparentFlag = (gcePacked & 0x01) !== 0;
          const delayHundredths = bytes[pos + 1] | (bytes[pos + 2] << 8);
          // GIFs with 0 or 1 delay usually default to 100ms in modern browsers
          currentDelayMs = delayHundredths <= 1 ? 100 : delayHundredths * 10;
          const transIndex = bytes[pos + 3];

          if (transparentFlag) {
            currentTransparentIndex = transIndex;
            hasTransparency = true;
          } else {
            currentTransparentIndex = null;
          }
          pos += blockSize;
          // Skip block terminator
          if (bytes[pos] === 0x00) pos++;
          continue;
        }

        // Application Extension (0xFF) -> Loop Count
        if (extType === 0xFF) {
          const appBlockSize = bytes[pos++];
          const appName = String.fromCharCode(...bytes.slice(pos, pos + appBlockSize));
          pos += appBlockSize;

          while (pos < bytes.length) {
            const subSize = bytes[pos++];
            if (subSize === 0) break;
            if (appName.startsWith('NETSCAPE') && subSize >= 3) {
              loopCount = bytes[pos + 1] | (bytes[pos + 2] << 8);
            }
            pos += subSize;
          }
          continue;
        }

        // Other Extensions: Comment (0xFE), Plain Text (0x01) -> Skip sub-blocks
        while (pos < bytes.length) {
          const subSize = bytes[pos++];
          if (subSize === 0) break;
          pos += subSize;
        }
        continue;
      }

      // Image Descriptor (0x2C)
      if (blockId === 0x2C) {
        const x = bytes[pos] | (bytes[pos + 1] << 8);
        const y = bytes[pos + 2] | (bytes[pos + 3] << 8);
        const frameW = bytes[pos + 4] | (bytes[pos + 5] << 8);
        const frameH = bytes[pos + 6] | (bytes[pos + 7] << 8);
        const imgPacked = bytes[pos + 8];
        pos += 9;

        const hasLocalColorTable = (imgPacked & 0x80) !== 0;
        const isInterlaced = (imgPacked & 0x40) !== 0;
        const localColorTableSize = 1 << ((imgPacked & 0x07) + 1);

        let activeColorTable: Uint8Array = globalColorTable || new Uint8Array(768);
        if (hasLocalColorTable) {
          const lctByteLength = localColorTableSize * 3;
          activeColorTable = bytes.slice(pos, pos + lctByteLength);
          pos += lctByteLength;
        }

        // LZW Minimum Code Size
        const lzwMinCodeSize = bytes[pos++];

        // Read all sub-blocks for this image data
        const subBlockChunks: Uint8Array[] = [];
        let totalChunkLength = 0;
        while (pos < bytes.length) {
          const subBlockLength = bytes[pos++];
          if (subBlockLength === 0) break;
          const chunk = bytes.slice(pos, pos + subBlockLength);
          subBlockChunks.push(chunk);
          totalChunkLength += subBlockLength;
          pos += subBlockLength;
        }

        // Concatenate sub-blocks
        const compressedData = new Uint8Array(totalChunkLength);
        let chunkOffset = 0;
        for (const chunk of subBlockChunks) {
          compressedData.set(chunk, chunkOffset);
          chunkOffset += chunk.length;
        }

        // Decompress LZW
        const pixelCount = frameW * frameH;
        const decompressed = GifExtractorEngine.decompressLzw(compressedData, lzwMinCodeSize, pixelCount);

        // De-interlace if interlaced
        const finalPixels = isInterlaced
          ? GifExtractorEngine.deinterlace(decompressed, frameW, frameH)
          : decompressed;

        rawFrames.push({
          index: rawFrames.length,
          delayMs: currentDelayMs,
          disposalMethod: currentDisposal,
          transparentIndex: currentTransparentIndex,
          x,
          y,
          width: frameW,
          height: frameH,
          pixels: finalPixels,
          colorTable: activeColorTable,
        });

        // Reset per-image Graphic Control defaults
        currentDelayMs = 100;
        currentDisposal = 0;
        currentTransparentIndex = null;
      }
    }

    if (rawFrames.length === 0) {
      throw new Error('No image frames found in GIF file.');
    }

    onProgress?.(0.65, 'Compositing and rendering frames...');

    // 2. Render and Composite All Frames
    const extractedFrames: GifFrameData[] = [];
    let cumulativeTimestamp = 0;

    for (let i = 0; i < rawFrames.length; i++) {
      const raw = rawFrames[i];

      // If disposal method is 3 (restore previous), save current working canvas before rendering
      if (raw.disposalMethod === 3) {
        backupCtx.clearRect(0, 0, screenWidth, screenHeight);
        backupCtx.drawImage(workingCanvas, 0, 0);
      }

      // Create ImageData for the current sub-frame
      const imgData = workingCtx.createImageData(raw.width, raw.height);
      const data = imgData.data;
      const pixels = raw.pixels;
      const colorTable = raw.colorTable;
      const transIdx = raw.transparentIndex;

      for (let p = 0; p < pixels.length; p++) {
        const colorIdx = pixels[p];
        const dataOffset = p * 4;

        if (transIdx !== null && colorIdx === transIdx) {
          data[dataOffset] = 0;
          data[dataOffset + 1] = 0;
          data[dataOffset + 2] = 0;
          data[dataOffset + 3] = 0; // Fully transparent
        } else {
          const ctOffset = colorIdx * 3;
          data[dataOffset] = colorTable[ctOffset] || 0;
          data[dataOffset + 1] = colorTable[ctOffset + 1] || 0;
          data[dataOffset + 2] = colorTable[ctOffset + 2] || 0;
          data[dataOffset + 3] = 255;
        }
      }

      // Draw sub-frame onto temp canvas to respect alpha blending on the working canvas
      const tempFrameCanvas = document.createElement('canvas');
      tempFrameCanvas.width = raw.width;
      tempFrameCanvas.height = raw.height;
      tempFrameCanvas.getContext('2d')!.putImageData(imgData, 0, 0);

      // Composite onto working canvas at (raw.x, raw.y)
      workingCtx.drawImage(tempFrameCanvas, raw.x, raw.y);

      // Snapshot the composite frame
      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = screenWidth;
      frameCanvas.height = screenHeight;
      const frameCtx = frameCanvas.getContext('2d')!;
      frameCtx.drawImage(workingCanvas, 0, 0);

      const dataUrl = frameCanvas.toDataURL('image/png');

      extractedFrames.push({
        index: i + 1,
        delayMs: raw.delayMs,
        timestampMs: cumulativeTimestamp,
        disposalMethod: raw.disposalMethod,
        canvas: frameCanvas,
        dataUrl,
        width: screenWidth,
        height: screenHeight,
      });

      cumulativeTimestamp += raw.delayMs;

      // Handle Disposal Methods for NEXT frame:
      // 0 = unspecified (keep)
      // 1 = do not dispose (keep)
      // 2 = restore to background color (clear the sub-rectangle)
      // 3 = restore to previous (restore saved canvas snapshot)
      if (raw.disposalMethod === 2) {
        workingCtx.clearRect(raw.x, raw.y, raw.width, raw.height);
      } else if (raw.disposalMethod === 3) {
        workingCtx.clearRect(0, 0, screenWidth, screenHeight);
        workingCtx.drawImage(backupCanvas, 0, 0);
      }

      const pct = 0.65 + (0.35 * ((i + 1) / rawFrames.length));
      onProgress?.(pct, `Processed frame ${i + 1} of ${rawFrames.length}...`);
    }

    const totalDurationMs = cumulativeTimestamp > 0 ? cumulativeTimestamp : extractedFrames.length * 100;
    const avgFps = totalDurationMs > 0 ? parseFloat(((extractedFrames.length / totalDurationMs) * 1000).toFixed(1)) : 10;

    return {
      metadata: {
        width: screenWidth,
        height: screenHeight,
        frameCount: extractedFrames.length,
        totalDurationMs,
        avgFps,
        hasTransparency,
        loopCount,
      },
      frames: extractedFrames,
    };
  }

  /**
   * LZW Decompressor for GIF raster data
   */
  private static decompressLzw(
    compressed: Uint8Array,
    minCodeSize: number,
    pixelCount: number
  ): Uint8Array {
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;
    let codeSize = minCodeSize + 1;
    let codeMask = (1 << codeSize) - 1;

    // Build initial code table
    const prefix = new Int32Array(4096);
    const suffix = new Uint8Array(4096);
    const pixelStack = new Uint8Array(4097);

    const resetCodeTable = () => {
      codeSize = minCodeSize + 1;
      codeMask = (1 << codeSize) - 1;
      for (let i = 0; i < clearCode; i++) {
        prefix[i] = -1;
        suffix[i] = i;
      }
      for (let i = clearCode; i < 4096; i++) {
        prefix[i] = -1;
        suffix[i] = 0;
      }
    };

    resetCodeTable();

    const output = new Uint8Array(pixelCount);
    let outputPos = 0;
    let bitPos = 0;
    let availableCode = clearCode + 2;
    let oldCode = -1;
    let first = 0;
    let top = 0;

    const dataLength = compressed.length;

    while (outputPos < pixelCount && (bitPos >> 3) < dataLength) {
      // Read code of length 'codeSize'
      const byteOffset = bitPos >> 3;
      const bitOffset = bitPos & 7;
      let rawBits = compressed[byteOffset] | ((compressed[byteOffset + 1] || 0) << 8);
      if (bitOffset + codeSize > 16) {
        rawBits |= (compressed[byteOffset + 2] || 0) << 16;
      }
      const code = (rawBits >> bitOffset) & codeMask;
      bitPos += codeSize;

      if (code === clearCode) {
        resetCodeTable();
        availableCode = clearCode + 2;
        oldCode = -1;
        continue;
      }

      if (code === eoiCode) {
        break;
      }

      if (oldCode === -1) {
        if (code < availableCode) {
          output[outputPos++] = suffix[code];
          oldCode = code;
          first = code;
        }
        continue;
      }

      let inCode = code;
      if (code >= availableCode) {
        pixelStack[top++] = first;
        inCode = oldCode;
      }

      while (inCode >= clearCode && inCode < 4096) {
        pixelStack[top++] = suffix[inCode];
        inCode = prefix[inCode];
      }

      first = suffix[inCode];
      pixelStack[top++] = first;

      // Add new code to table
      if (availableCode < 4096) {
        prefix[availableCode] = oldCode;
        suffix[availableCode] = first;
        availableCode++;
        if ((availableCode & codeMask) === 0 && availableCode < 4096) {
          codeSize++;
          codeMask = (1 << codeSize) - 1;
        }
      }

      oldCode = code;

      // Drain pixel stack into output
      while (top > 0 && outputPos < pixelCount) {
        output[outputPos++] = pixelStack[--top];
      }
    }

    return output;
  }

  /**
   * 4-Pass De-interlacing Algorithm
   */
  private static deinterlace(pixels: Uint8Array, width: number, height: number): Uint8Array {
    const result = new Uint8Array(width * height);
    const passes = [
      { start: 0, step: 8 },
      { start: 4, step: 8 },
      { start: 2, step: 4 },
      { start: 1, step: 2 },
    ];

    let srcPos = 0;
    for (const p of passes) {
      for (let y = p.start; y < height; y += p.step) {
        const destPos = y * width;
        result.set(pixels.subarray(srcPos, srcPos + width), destPos);
        srcPos += width;
      }
    }
    return result;
  }

  /**
   * Generate an in-memory animated procedural sample GIF for 1-click testing
   */
  public static async generateSampleAnimatedGif(): Promise<{ file: File; dataUrl: string }> {
    const width = 240;
    const height = 240;
    const totalFrames = 12;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Build a GIF89a binary manually for standard testing
    // Palette (4 colors: Dark background #1E293B, Blue #3B82F6, Indigo #6366F1, White #FFFFFF)
    const gct = new Uint8Array([
      30, 41, 59,    // 0: #1E293B
      59, 130, 246,  // 1: #3B82F6
      99, 102, 241,  // 2: #6366F1
      255, 255, 255, // 3: #FFFFFF
    ]);

    // Build simple binary GIF sequence
    const parts: Uint8Array[] = [];

    // Header & Logical Screen Descriptor (240x240, GCT size 4)
    const header = new Uint8Array([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // GIF89a
      0xF0, 0x00, 0xF0, 0x00,             // 240 x 240
      0x81,                               // GCT present, 4 colors (2^(1+1))
      0x00,                               // Background color index 0
      0x00,                               // Aspect ratio
    ]);
    parts.push(header);
    parts.push(gct);

    // Netscape loop extension
    parts.push(new Uint8Array([
      0x21, 0xFF, 0x0B,
      0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2E, 0x30, // NETSCAPE2.0
      0x03, 0x01, 0x00, 0x00, 0x00,
    ]));

    // Generate 12 bouncing animated frames
    for (let f = 0; f < totalFrames; f++) {
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 0, width, height);

      // Rotating glow circle
      const angle = (f / totalFrames) * Math.PI * 2;
      const cx = width / 2 + Math.cos(angle) * 45;
      const cy = height / 2 + Math.sin(angle) * 45;

      ctx.fillStyle = '#3B82F6';
      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#6366F1';
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fill();

      // Text badge
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`FRAME ${f + 1}`, width / 2, height / 2);

      // Convert canvas to indexed 4-color raster
      const imgData = ctx.getImageData(0, 0, width, height).data;
      const raster = new Uint8Array(width * height);
      for (let p = 0; p < raster.length; p++) {
        const r = imgData[p * 4];
        const g = imgData[p * 4 + 1];
        const b = imgData[p * 4 + 2];
        if (r > 200 && g > 200 && b > 200) raster[p] = 3;
        else if (r > 70 && b > 200) raster[p] = 2;
        else if (b > 200) raster[p] = 1;
        else raster[p] = 0;
      }

      // Graphic Control Extension (Delay 8 = 80ms)
      parts.push(new Uint8Array([0x21, 0xF9, 0x04, 0x00, 0x08, 0x00, 0x00, 0x00]));

      // Image Descriptor (0,0 to 240,240)
      parts.push(new Uint8Array([
        0x2C,
        0x00, 0x00, 0x00, 0x00,
        0xF0, 0x00, 0xF0, 0x00,
        0x00,
      ]));

      // LZW compress with min code size 2
      const lzwBlock = GifExtractorEngine.simpleLzwEncode(raster, 2);
      parts.push(lzwBlock);
    }

    // Trailer
    parts.push(new Uint8Array([0x3B]));

    // Total Blob
    const totalLength = parts.reduce((acc, p) => acc + p.length, 0);
    const finalBuffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const p of parts) {
      finalBuffer.set(p, offset);
      offset += p.length;
    }

    const blob = new Blob([finalBuffer], { type: 'image/gif' });
    const file = new File([blob], 'sample-animation.gif', { type: 'image/gif' });
    const dataUrl = URL.createObjectURL(blob);

    return { file, dataUrl };
  }

  /**
   * Helper LZW Encoder for Sample GIF creation
   */
  private static simpleLzwEncode(raster: Uint8Array, minCodeSize: number): Uint8Array {
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;

    let codeSize = minCodeSize + 1;
    let nextCode = eoiCode + 1;
    const codeTable = new Map<string, number>();

    const initTable = () => {
      codeTable.clear();
      for (let i = 0; i < clearCode; i++) {
        codeTable.set(String(i), i);
      }
      codeSize = minCodeSize + 1;
      nextCode = eoiCode + 1;
    };

    initTable();

    const outputCodes: number[] = [clearCode];
    let currentPrefix = '';

    for (let i = 0; i < raster.length; i++) {
      const val = raster[i].toString();
      const combined = currentPrefix === '' ? val : `${currentPrefix},${val}`;

      if (codeTable.has(combined)) {
        currentPrefix = combined;
      } else {
        outputCodes.push(codeTable.get(currentPrefix)!);
        if (nextCode < 4096) {
          codeTable.set(combined, nextCode++);
          if (nextCode > (1 << codeSize) && codeSize < 12) {
            codeSize++;
          }
        } else {
          outputCodes.push(clearCode);
          initTable();
        }
        currentPrefix = val;
      }
    }

    if (currentPrefix !== '') {
      outputCodes.push(codeTable.get(currentPrefix)!);
    }
    outputCodes.push(eoiCode);

    // Pack variable length codes into bitstream bytes
    const byteChunks: number[] = [];
    let curByte = 0;
    let curBits = 0;
    codeSize = minCodeSize + 1;
    let limit = 1 << codeSize;
    let codeCounter = eoiCode + 1;

    for (const code of outputCodes) {
      curByte |= (code << curBits);
      curBits += codeSize;

      while (curBits >= 8) {
        byteChunks.push(curByte & 0xFF);
        curByte >>= 8;
        curBits -= 8;
      }

      if (code === clearCode) {
        codeSize = minCodeSize + 1;
        limit = 1 << codeSize;
        codeCounter = eoiCode + 1;
      } else if (code === eoiCode) {
        // end
      } else {
        codeCounter++;
        if (codeCounter > limit && codeSize < 12) {
          codeSize++;
          limit = 1 << codeSize;
        }
      }
    }

    if (curBits > 0) {
      byteChunks.push(curByte & 0xFF);
    }

    // Format into sub-blocks (max 254 bytes per sub-block)
    const resultParts: number[] = [minCodeSize];
    let pos = 0;
    while (pos < byteChunks.length) {
      const chunkSize = Math.min(254, byteChunks.length - pos);
      resultParts.push(chunkSize);
      for (let c = 0; c < chunkSize; c++) {
        resultParts.push(byteChunks[pos + c]);
      }
      pos += chunkSize;
    }
    resultParts.push(0x00); // Block terminator

    return new Uint8Array(resultParts);
  }
}
