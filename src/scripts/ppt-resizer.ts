/**
 * ppt-resizer.ts
 * 100% Client-Side Pure TypeScript PowerPoint (.pptx) Slide Resizing & OpenXML Processing Engine.
 * Supports standard PKZIP decompression (deflate-raw) via Web Streams API,
 * OpenXML <p:sldSz> slide dimension editing, and shape coordinate scaling.
 */

export interface SlideSizePreset {
  id: string;
  name: string;
  aspectRatio: string;
  widthInches: number;
  heightInches: number;
  widthEmus: number;
  heightEmus: number;
  typeAttr: string;
}

export const SLIDE_PRESETS: SlideSizePreset[] = [
  {
    id: '16-9',
    name: '16:9 Widescreen (Modern Standard)',
    aspectRatio: '16:9',
    widthInches: 13.333,
    heightInches: 7.5,
    widthEmus: 12192000,
    heightEmus: 6858000,
    typeAttr: 'screen16x9',
  },
  {
    id: '4-3',
    name: '4:3 Standard (Traditional / Projectors)',
    aspectRatio: '4:3',
    widthInches: 10.0,
    heightInches: 7.5,
    widthEmus: 9144000,
    heightEmus: 6858000,
    typeAttr: 'screen4x3',
  },
  {
    id: '16-10',
    name: '16:10 Widescreen (Mac / Laptop Displays)',
    aspectRatio: '16:10',
    widthInches: 10.0,
    heightInches: 6.25,
    widthEmus: 9144000,
    heightEmus: 5715000,
    typeAttr: 'screen16x10',
  },
  {
    id: 'a4-landscape',
    name: 'A4 Paper Landscape (29.7 × 21.0 cm)',
    aspectRatio: '1.41:1',
    widthInches: 11.693,
    heightInches: 8.268,
    widthEmus: 10692000,
    heightEmus: 7559040,
    typeAttr: 'A4',
  },
  {
    id: 'a4-portrait',
    name: 'A4 Paper Portrait (21.0 × 29.7 cm)',
    aspectRatio: '1:1.41',
    widthInches: 8.268,
    heightInches: 11.693,
    widthEmus: 7559040,
    heightEmus: 10692000,
    typeAttr: 'A4',
  },
  {
    id: 'letter-landscape',
    name: 'US Letter Landscape (11 × 8.5 in)',
    aspectRatio: '1.29:1',
    widthInches: 11.0,
    heightInches: 8.5,
    widthEmus: 10058400,
    heightEmus: 7772400,
    typeAttr: 'letter',
  },
  {
    id: 'letter-portrait',
    name: 'US Letter Portrait (8.5 × 11 in)',
    aspectRatio: '1:1.29',
    widthInches: 8.5,
    heightInches: 11.0,
    widthEmus: 7772400,
    heightEmus: 10058400,
    typeAttr: 'letter',
  },
  {
    id: 'a3-poster',
    name: 'A3 Poster Landscape (42.0 × 29.7 cm)',
    aspectRatio: '1.41:1',
    widthInches: 16.535,
    heightInches: 11.693,
    widthEmus: 15120000,
    heightEmus: 10692000,
    typeAttr: 'A3',
  },
  {
    id: 'square',
    name: 'Square 1:1 (Social / Carousels)',
    aspectRatio: '1:1',
    widthInches: 8.0,
    heightInches: 8.0,
    widthEmus: 7315200,
    heightEmus: 7315200,
    typeAttr: 'custom',
  },
  {
    id: 'custom',
    name: 'Custom Dimensions',
    aspectRatio: 'Custom',
    widthInches: 13.333,
    heightInches: 7.5,
    widthEmus: 12192000,
    heightEmus: 6858000,
    typeAttr: 'custom',
  },
];

export interface PresentationInfo {
  fileName: string;
  fileSizeBytes: number;
  totalSlides: number;
  originalWidthEmus: number;
  originalHeightEmus: number;
  originalWidthInches: number;
  originalHeightInches: number;
  originalWidthCm: number;
  originalHeightCm: number;
  originalWidthMm: number;
  originalHeightMm: number;
  originalWidthPt: number;
  originalHeightPt: number;
  originalWidthPx: number;
  originalHeightPx: number;
  aspectRatioName: string;
  aspectRatioDecimal: number;
}

export interface PptResizeOptions {
  presetId: string;
  targetWidthEmus: number;
  targetHeightEmus: number;
  orientation: 'landscape' | 'portrait';
  scaleContent: boolean; // whether to scale shape coordinates in slide XMLs
  typeAttr: string;
}

export interface PptxZipEntry {
  name: string;
  method: number; // 0 = stored, 8 = deflate
  crc32: number;
  compressedSize: number;
  uncompressedSize: number;
  compressedData: Uint8Array;
  uncompressedData?: Uint8Array | null;
}

export class PptResizerEngine {
  public static readonly EMUS_PER_INCH = 914400;
  public static readonly EMUS_PER_CM = 360000;
  public static readonly EMUS_PER_MM = 36000;
  public static readonly EMUS_PER_PT = 12700;
  public static readonly EMUS_PER_PX = 9525; // 96 DPI standard

  /**
   * Decompress raw deflate stream using native browser Web Streams API.
   */
  public static async inflateRaw(data: Uint8Array): Promise<Uint8Array> {
    const ds = new DecompressionStream('deflate-raw');
    const stream = new Response(data).body!.pipeThrough(ds);
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  /**
   * Compress raw stream using native browser Web Streams API.
   */
  public static async deflateRaw(data: Uint8Array): Promise<Uint8Array> {
    const cs = new CompressionStream('deflate-raw');
    const stream = new Response(data).body!.pipeThrough(cs);
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  /**
   * Read uncompressed bytes of an entry on-demand.
   */
  public static async getEntryData(entry: PptxZipEntry): Promise<Uint8Array> {
    if (entry.uncompressedData) {
      return entry.uncompressedData;
    }
    if (entry.method === 0) {
      entry.uncompressedData = entry.compressedData;
    } else if (entry.method === 8) {
      entry.uncompressedData = await PptResizerEngine.inflateRaw(entry.compressedData);
    } else {
      throw new Error(`Unsupported compression method ${entry.method} in entry ${entry.name}`);
    }
    return entry.uncompressedData;
  }

  /**
   * Robust In-Memory PKZIP Archive Parser via Central Directory.
   * Handles streamed files, data descriptors, and both stored & deflated entries.
   */
  public static unzip(data: Uint8Array): PptxZipEntry[] {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    // 1. Locate End of Central Directory (EOCD) signature: 0x06054b50
    let eocdOffset = -1;
    for (let i = data.length - 22; i >= Math.max(0, data.length - 65557); i--) {
      if (view.getUint32(i, true) === 0x06054b50) {
        eocdOffset = i;
        break;
      }
    }

    if (eocdOffset === -1) {
      // Fallback: simple sequential local file header scan if EOCD is absent
      return PptResizerEngine.unzipFallback(data);
    }

    const totalEntries = view.getUint16(eocdOffset + 10, true);
    const cdOffset = view.getUint32(eocdOffset + 16, true);

    const entries: PptxZipEntry[] = [];
    let cdPos = cdOffset;

    for (let i = 0; i < totalEntries; i++) {
      if (cdPos + 46 > data.length || view.getUint32(cdPos, true) !== 0x02014b50) {
        break;
      }

      const method = view.getUint16(cdPos + 10, true);
      const fileCrc = view.getUint32(cdPos + 16, true);
      const compSize = view.getUint32(cdPos + 20, true);
      const uncompSize = view.getUint32(cdPos + 24, true);
      const nameLen = view.getUint16(cdPos + 28, true);
      const extraLen = view.getUint16(cdPos + 30, true);
      const commentLen = view.getUint16(cdPos + 32, true);
      const localOffset = view.getUint32(cdPos + 42, true);

      const nameBytes = data.subarray(cdPos + 46, cdPos + 46 + nameLen);
      const name = new TextDecoder().decode(nameBytes);

      // Locate actual compressed payload inside local header
      if (localOffset + 30 <= data.length) {
        const localNameLen = view.getUint16(localOffset + 26, true);
        const localExtraLen = view.getUint16(localOffset + 28, true);
        const dataStart = localOffset + 30 + localNameLen + localExtraLen;
        const compressedData = data.subarray(dataStart, dataStart + compSize);

        entries.push({
          name,
          method,
          crc32: fileCrc,
          compressedSize: compSize,
          uncompressedSize: uncompSize,
          compressedData,
          uncompressedData: null,
        });
      }

      cdPos += 46 + nameLen + extraLen + commentLen;
    }

    return entries;
  }

  /**
   * Fallback sequential local header parser for non-standard ZIP archives.
   */
  private static unzipFallback(data: Uint8Array): PptxZipEntry[] {
    const entries: PptxZipEntry[] = [];
    let i = 0;
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    while (i < data.length - 30) {
      const sig = view.getUint32(i, true);
      if (sig !== 0x04034b50) break;

      const method = view.getUint16(i + 8, true);
      const fileCrc = view.getUint32(i + 14, true);
      const compSize = view.getUint32(i + 18, true);
      const uncompSize = view.getUint32(i + 22, true);
      const nameLen = view.getUint16(i + 26, true);
      const extraLen = view.getUint16(i + 28, true);

      const nameBytes = data.subarray(i + 30, i + 30 + nameLen);
      const name = new TextDecoder().decode(nameBytes);

      const dataStart = i + 30 + nameLen + extraLen;
      const compressedData = data.subarray(dataStart, dataStart + compSize);

      entries.push({
        name,
        method,
        crc32: fileCrc,
        compressedSize: compSize,
        uncompressedSize: uncompSize,
        compressedData,
        uncompressedData: null,
      });

      i = dataStart + compSize;
    }

    return entries;
  }

  /**
   * Parse PPTX file in-memory and extract current presentation dimensions & metadata.
   */
  public static async inspectPptx(file: File | Blob): Promise<{ info: PresentationInfo; zipEntries: PptxZipEntry[] }> {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const zipEntries = PptResizerEngine.unzip(bytes);

    let totalSlides = 0;
    let presentationXmlStr = '';

    for (const entry of zipEntries) {
      if (entry.name === 'ppt/presentation.xml') {
        const rawXml = await PptResizerEngine.getEntryData(entry);
        presentationXmlStr = new TextDecoder().decode(rawXml);
      } else if (entry.name.startsWith('ppt/slides/slide') && entry.name.endsWith('.xml')) {
        totalSlides++;
      }
    }

    if (!presentationXmlStr) {
      throw new Error('Invalid PowerPoint file. Unable to locate presentation.xml.');
    }

    // Extract <p:sldSz cx="..." cy="..." .../>
    const match = presentationXmlStr.match(/<p:sldSz\s+([^>]+)\/?>/i);
    let cx = 12192000; // default 16:9
    let cy = 6858000;

    if (match) {
      const cxMatch = match[1].match(/cx="(\d+)"/i);
      const cyMatch = match[1].match(/cy="(\d+)"/i);
      if (cxMatch) cx = parseInt(cxMatch[1], 10);
      if (cyMatch) cy = parseInt(cyMatch[1], 10);
    }

    const widthInches = parseFloat((cx / PptResizerEngine.EMUS_PER_INCH).toFixed(2));
    const heightInches = parseFloat((cy / PptResizerEngine.EMUS_PER_INCH).toFixed(2));
    const widthCm = parseFloat((cx / PptResizerEngine.EMUS_PER_CM).toFixed(2));
    const heightCm = parseFloat((cy / PptResizerEngine.EMUS_PER_CM).toFixed(2));
    const widthMm = parseFloat((cx / PptResizerEngine.EMUS_PER_MM).toFixed(1));
    const heightMm = parseFloat((cy / PptResizerEngine.EMUS_PER_MM).toFixed(1));
    const widthPt = Math.round(cx / PptResizerEngine.EMUS_PER_PT);
    const heightPt = Math.round(cy / PptResizerEngine.EMUS_PER_PT);
    const widthPx = Math.round(cx / PptResizerEngine.EMUS_PER_PX);
    const heightPx = Math.round(cy / PptResizerEngine.EMUS_PER_PX);
    const aspectRatioDecimal = cx / cy;

    // Detect friendly aspect ratio label
    let aspectRatioName = 'Custom';
    if (Math.abs(aspectRatioDecimal - 16 / 9) < 0.05) {
      aspectRatioName = '16:9 Widescreen';
    } else if (Math.abs(aspectRatioDecimal - 4 / 3) < 0.05) {
      aspectRatioName = '4:3 Standard';
    } else if (Math.abs(aspectRatioDecimal - 16 / 10) < 0.05) {
      aspectRatioName = '16:10 Widescreen';
    } else if (Math.abs(aspectRatioDecimal - 1.414) < 0.05) {
      aspectRatioName = 'A4 Landscape';
    } else if (Math.abs(aspectRatioDecimal - 1 / 1.414) < 0.05) {
      aspectRatioName = 'A4 Portrait';
    } else if (Math.abs(aspectRatioDecimal - 1.294) < 0.05) {
      aspectRatioName = 'Letter Landscape';
    } else if (Math.abs(aspectRatioDecimal - 1 / 1.294) < 0.05) {
      aspectRatioName = 'Letter Portrait';
    } else if (Math.abs(aspectRatioDecimal - 1.0) < 0.05) {
      aspectRatioName = '1:1 Square';
    }

    const name = file instanceof File ? file.name : 'presentation.pptx';

    return {
      info: {
        fileName: name,
        fileSizeBytes: file.size,
        totalSlides: Math.max(totalSlides, 1),
        originalWidthEmus: cx,
        originalHeightEmus: cy,
        originalWidthInches: widthInches,
        originalHeightInches: heightInches,
        originalWidthCm: widthCm,
        originalHeightCm: heightCm,
        originalWidthMm: widthMm,
        originalHeightMm: heightMm,
        originalWidthPt: widthPt,
        originalHeightPt: heightPt,
        originalWidthPx: widthPx,
        originalHeightPx: heightPx,
        aspectRatioName,
        aspectRatioDecimal,
      },
      zipEntries,
    };
  }

  /**
   * Resize PPTX by updating presentation.xml slide size and rebuilding the zip archive.
   */
  public static async resizePptx(
    zipEntries: PptxZipEntry[],
    options: PptResizeOptions,
    originalCx: number,
    originalCy: number,
    onProgress?: (pct: number) => void
  ): Promise<Blob> {
    const scaleX = options.targetWidthEmus / originalCx;
    const scaleY = options.targetHeightEmus / originalCy;

    const modifiedEntries: PptxZipEntry[] = [];
    const total = zipEntries.length;

    for (let i = 0; i < total; i++) {
      const entry = zipEntries[i];

      if (entry.name === 'ppt/presentation.xml') {
        const rawXml = await PptResizerEngine.getEntryData(entry);
        let xml = new TextDecoder().decode(rawXml);

        // Replace <p:sldSz .../> with updated cx, cy, type
        const newSldSz = `<p:sldSz cx="${options.targetWidthEmus}" cy="${options.targetHeightEmus}" type="${options.typeAttr}"/>`;
        if (/<p:sldSz[^>]*\/?>/i.test(xml)) {
          xml = xml.replace(/<p:sldSz[^>]*\/?>/i, newSldSz);
        } else {
          // If not present, insert right before </p:presentation>
          xml = xml.replace('</p:presentation>', `${newSldSz}</p:presentation>`);
        }

        entry.uncompressedData = new TextEncoder().encode(xml);
        modifiedEntries.push(entry);
      } else if (options.scaleContent && entry.name.startsWith('ppt/slides/slide') && entry.name.endsWith('.xml')) {
        // Proportional scaling of slide shape transforms (x, y, cx, cy)
        const rawXml = await PptResizerEngine.getEntryData(entry);
        let xml = new TextDecoder().decode(rawXml);

        // Scale offsets: <a:off x="123" y="456"/>
        xml = xml.replace(/<a:off\s+x="(\d+)"\s+y="(\d+)"/gi, (_, xStr, yStr) => {
          const newX = Math.round(parseInt(xStr, 10) * scaleX);
          const newY = Math.round(parseInt(yStr, 10) * scaleY);
          return `<a:off x="${newX}" y="${newY}"`;
        });

        // Scale extents: <a:ext cx="123" cy="456"/>
        xml = xml.replace(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/gi, (_, cxStr, cyStr) => {
          const newCx = Math.round(parseInt(cxStr, 10) * scaleX);
          const newCy = Math.round(parseInt(cyStr, 10) * scaleY);
          return `<a:ext cx="${newCx}" cy="${newCy}"`;
        });

        entry.uncompressedData = new TextEncoder().encode(xml);
        modifiedEntries.push(entry);
      } else {
        // Retain original compressed payload without recompressing
        modifiedEntries.push(entry);
      }

      if (onProgress && i % 4 === 0) {
        onProgress(Math.round((i / total) * 75));
      }
    }

    if (onProgress) onProgress(80);

    // Build standard PPTX PKZIP archive
    const resultBlob = await PptResizerEngine.createZipArchive(
      modifiedEntries,
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      (pct) => {
        if (onProgress) onProgress(80 + Math.round(pct * 0.2));
      }
    );

    if (onProgress) onProgress(100);
    return resultBlob;
  }

  /**
   * Fast In-Memory PKZIP Archive Builder.
   * Compresses modified entries with DEFLATE while passing through untouched media streams.
   */
  public static async createZipArchive(
    files: PptxZipEntry[],
    mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    onZipProgress?: (pct: number) => void
  ): Promise<Blob> {
    interface PreparedFile {
      name: string;
      nameBytes: Uint8Array;
      method: number;
      crc: number;
      compSize: number;
      uncompSize: number;
      data: Uint8Array;
    }

    const prepared: PreparedFile[] = [];
    const totalFiles = files.length;

    for (let idx = 0; idx < totalFiles; idx++) {
      const file = files[idx];
      let compData = file.compressedData;
      let method = file.method;
      let fileCrc = file.crc32;
      let uncompSize = file.uncompressedSize;

      if (file.uncompressedData) {
        // Content was modified -> compress with DEFLATE
        uncompSize = file.uncompressedData.length;
        fileCrc = PptResizerEngine.crc32(file.uncompressedData);
        compData = await PptResizerEngine.deflateRaw(file.uncompressedData);
        method = 8;
      }

      prepared.push({
        name: file.name,
        nameBytes: new TextEncoder().encode(file.name),
        method,
        crc: fileCrc,
        compSize: compData.length,
        uncompSize,
        data: compData,
      });

      if (onZipProgress && idx % 5 === 0) {
        onZipProgress(Math.round((idx / totalFiles) * 80));
      }
    }

    const localHeaders: Uint8Array[] = [];
    const cdHeaders: Uint8Array[] = [];
    let currentOffset = 0;

    for (const file of prepared) {
      const lh = new Uint8Array(30 + file.nameBytes.length + file.data.length);
      const view = new DataView(lh.buffer);

      view.setUint32(0, 0x04034b50, true);
      view.setUint16(4, 20, true); // version needed: 2.0
      view.setUint16(6, 0, true); // flags
      view.setUint16(8, file.method, true);
      view.setUint16(10, 0, true);
      view.setUint16(12, 0, true);
      view.setUint32(14, file.crc, true);
      view.setUint32(18, file.compSize, true);
      view.setUint32(22, file.uncompSize, true);
      view.setUint16(26, file.nameBytes.length, true);
      view.setUint16(28, 0, true);

      lh.set(file.nameBytes, 30);
      lh.set(file.data, 30 + file.nameBytes.length);
      localHeaders.push(lh);

      const cdh = new Uint8Array(46 + file.nameBytes.length);
      const cdView = new DataView(cdh.buffer);

      cdView.setUint32(0, 0x02014b50, true);
      cdView.setUint16(4, 20, true); // version made by
      cdView.setUint16(6, 20, true); // version needed
      cdView.setUint16(8, 0, true);
      cdView.setUint16(10, file.method, true);
      cdView.setUint16(12, 0, true);
      cdView.setUint16(14, 0, true);
      cdView.setUint32(16, file.crc, true);
      cdView.setUint32(20, file.compSize, true);
      cdView.setUint32(24, file.uncompSize, true);
      cdView.setUint16(28, file.nameBytes.length, true);
      cdView.setUint16(30, 0, true);
      cdView.setUint16(32, 0, true);
      cdView.setUint16(34, 0, true);
      cdView.setUint16(36, 0, true);
      cdView.setUint32(38, 0, true);
      cdView.setUint32(42, currentOffset, true);

      cdh.set(file.nameBytes, 46);
      cdHeaders.push(cdh);

      currentOffset += lh.length;
    }

    const cdStart = currentOffset;
    let cdSize = 0;
    for (const cdh of cdHeaders) cdSize += cdh.length;

    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);

    eocdView.setUint32(0, 0x06054b50, true);
    eocdView.setUint16(4, 0, true);
    eocdView.setUint16(6, 0, true);
    eocdView.setUint16(8, prepared.length, true);
    eocdView.setUint16(10, prepared.length, true);
    eocdView.setUint32(12, cdSize, true);
    eocdView.setUint32(16, cdStart, true);
    eocdView.setUint16(20, 0, true);

    if (onZipProgress) onZipProgress(100);

    return new Blob([...localHeaders, ...cdHeaders, eocd], {
      type: mimeType,
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
   * 1-Click Procedural Sample PPTX Presentation Generator.
   * Generates a standard 4:3 PowerPoint presentation deck to test resizing.
   */
  public static async generateSamplePptx(): Promise<File> {
    const files: { name: string; data: Uint8Array }[] = [];

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`;

    const presentationRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
</Relationships>`;

    // 4:3 Sample Presentation (cx="9144000" cy="6858000")
    const presentationXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst/>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000" type="screen4x3"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;

    const slide1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Title 1"/>
          <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
          <p:nvPr><p:ph type="ctrTitle"/></p:nvPr>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="685800" y="2133600"/>
            <a:ext cx="7772400" cy="1470025"/>
          </a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="4000" b="1"/>
              <a:t>Quarterly Business Review</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

    files.push({ name: '[Content_Types].xml', data: new TextEncoder().encode(contentTypesXml) });
    files.push({ name: '_rels/.rels', data: new TextEncoder().encode(relsXml) });
    files.push({ name: 'ppt/_rels/presentation.xml.rels', data: new TextEncoder().encode(presentationRelsXml) });
    files.push({ name: 'ppt/presentation.xml', data: new TextEncoder().encode(presentationXml) });
    files.push({ name: 'ppt/slides/slide1.xml', data: new TextEncoder().encode(slide1Xml) });

    const zipEntries: PptxZipEntry[] = [];
    for (const f of files) {
      zipEntries.push({
        name: f.name,
        method: 0,
        crc32: PptResizerEngine.crc32(f.data),
        compressedSize: f.data.length,
        uncompressedSize: f.data.length,
        compressedData: f.data,
        uncompressedData: f.data,
      });
    }

    const zipBlob = await PptResizerEngine.createZipArchive(
      zipEntries,
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );

    return new File([zipBlob], 'sample-quarterly-review-4x3.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });
  }
}
