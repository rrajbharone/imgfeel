/**
 * Client-Side Binary Image Format & Magic Byte Detection Engine
 * 100% In-Browser Privacy • Zero Server Uploads
 */

export interface BrowserSupport {
  chrome: string;
  safari: string;
  firefox: string;
  edge: string;
  iosSafari: string;
  androidChrome: string;
}

export interface FormatAnalysis {
  name: string;
  fileSize: number;
  fileSizeFormatted: string;
  declaredExtension: string;
  actualExtension: string;
  isExtensionMismatch: boolean;
  detectedFormat: string;
  shortName: string;
  mimeType: string;
  hexSignature: string;
  containerInfo: string;
  compressionType: 'Lossy' | 'Lossless' | 'Vector' | 'Uncompressed' | 'Mixed';
  hasAlpha: boolean;
  isAnimated: boolean;
  width: number;
  height: number;
  aspectRatio: string;
  colorDepth: string;
  previewUrl: string;
  browserSupport: BrowserSupport;
  recommendation: string;
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getGcd(a: number, b: number): number {
  return b === 0 ? a : getGcd(b, a % b);
}

function getAspectRatio(w: number, h: number): string {
  if (!w || !h) return 'N/A';
  const divisor = getGcd(w, h);
  const rw = w / divisor;
  const rh = h / divisor;
  if (rw <= 32 && rh <= 32) {
    return `${rw}:${rh}`;
  }
  return `${(w / h).toFixed(2)}:1`;
}

function bufferToHex(buffer: ArrayBuffer, length = 16): string {
  const uint8 = new Uint8Array(buffer.slice(0, length));
  return Array.from(uint8)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}

function bufferToAscii(buffer: ArrayBuffer, offset = 0, length = 64): string {
  const uint8 = new Uint8Array(buffer.slice(offset, offset + length));
  let str = '';
  for (let i = 0; i < uint8.length; i++) {
    const code = uint8[i];
    str += code >= 32 && code <= 126 ? String.fromCharCode(code) : '.';
  }
  return str;
}

/**
 * Parses binary buffer to detect true image container and compression formats.
 */
export async function analyzeImageFormat(file: File): Promise<FormatAnalysis> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const declaredExt = file.name.includes('.')
    ? '.' + file.name.split('.').pop()!.toLowerCase()
    : '';

  const hexSig = bufferToHex(buffer, 12);
  const previewUrl = URL.createObjectURL(file);

  // Defaults
  let detectedFormat = 'Unknown / Unrecognized File';
  let shortName = 'UNKNOWN';
  let actualExtension = declaredExt || '.bin';
  let mimeType = file.type || 'application/octet-stream';
  let containerInfo = 'Raw Binary Data';
  let compressionType: 'Lossy' | 'Lossless' | 'Vector' | 'Uncompressed' | 'Mixed' = 'Lossy';
  let hasAlpha = false;
  let isAnimated = false;
  let colorDepth = '24-bit RGB';
  let browserSupport: BrowserSupport = {
    chrome: 'Supported',
    safari: 'Supported',
    firefox: 'Supported',
    edge: 'Supported',
    iosSafari: 'Supported',
    androidChrome: 'Supported',
  };
  let recommendation = 'Standard web image format.';

  // 1. JPEG / JPG (FF D8 FF)
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    detectedFormat = 'JPEG (Joint Photographic Experts Group)';
    shortName = 'JPEG';
    actualExtension = '.jpg';
    mimeType = 'image/jpeg';
    compressionType = 'Lossy';
    hasAlpha = false;
    isAnimated = false;
    colorDepth = '24-bit Truecolor (8-bit per channel)';
    containerInfo = 'JFIF / EXIF Container';
    browserSupport = {
      chrome: 'Universal (All versions)',
      safari: 'Universal (All versions)',
      firefox: 'Universal (All versions)',
      edge: 'Universal (All versions)',
      iosSafari: 'Universal (All versions)',
      androidChrome: 'Universal (All versions)',
    };
    recommendation = 'Ideal for complex photographs and gradients. Convert to WebP or AVIF for 30-50% smaller web payloads.';
  }

  // 2. PNG (89 50 4E 47 0D 0A 1A 0A)
  else if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    let colorType = 2; // Default Truecolor
    let bitDepth = 8;
    let isApng = false;

    if (bytes.length >= 26) {
      bitDepth = bytes[24];
      colorType = bytes[25];
      hasAlpha = colorType === 4 || colorType === 6; // 4: Greyscale+Alpha, 6: RGBA
    }

    // Scan for acTL chunk (Animated PNG)
    const ascii = bufferToAscii(buffer, 0, Math.min(buffer.byteLength, 2048));
    if (ascii.includes('acTL')) {
      isApng = true;
      isAnimated = true;
    }

    detectedFormat = isApng
      ? 'APNG (Animated Portable Network Graphics)'
      : 'PNG (Portable Network Graphics)';
    shortName = isApng ? 'APNG' : 'PNG';
    actualExtension = '.png';
    mimeType = 'image/png';
    compressionType = 'Lossless';
    colorDepth = hasAlpha ? '32-bit RGBA with Alpha' : `${bitDepth * 3}-bit Truecolor`;
    containerInfo = isApng ? 'APNG Multi-Frame Chunks' : 'Deflate / Zlib Chunked Container';
    browserSupport = {
      chrome: 'Universal (All versions)',
      safari: 'Universal (All versions)',
      firefox: 'Universal (All versions)',
      edge: 'Universal (All versions)',
      iosSafari: 'Universal (All versions)',
      androidChrome: 'Universal (All versions)',
    };
    recommendation = hasAlpha
      ? 'High-quality lossless graphic with alpha transparency. Ideal for logos, icons, and UI elements.'
      : 'Crisp lossless image. For photos without transparency, WebP or JPEG offers significantly smaller file sizes.';
  }

  // 3. WebP (RIFF....WEBP)
  else if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    const chunkTag = bufferToAscii(buffer, 12, 4);
    if (chunkTag === 'VP8L') {
      detectedFormat = 'WebP (Lossless)';
      compressionType = 'Lossless';
      hasAlpha = true;
      containerInfo = 'Google WebP Lossless (VP8L)';
    } else if (chunkTag === 'VP8 ') {
      detectedFormat = 'WebP (Lossy)';
      compressionType = 'Lossy';
      hasAlpha = false;
      containerInfo = 'Google WebP Lossy (VP8)';
    } else if (chunkTag === 'VP8X') {
      // Extended container
      const flags = bytes[20];
      hasAlpha = (flags & 0x10) !== 0;
      isAnimated = (flags & 0x02) !== 0;
      detectedFormat = isAnimated ? 'WebP (Animated)' : 'WebP (Extended VP8X)';
      compressionType = 'Mixed';
      containerInfo = `Google WebP Extended (${isAnimated ? 'Animated' : 'Static'}${hasAlpha ? ', Alpha' : ''})`;
    } else {
      detectedFormat = 'WebP Image';
      containerInfo = 'Google WebP Container';
    }

    shortName = 'WebP';
    actualExtension = '.webp';
    mimeType = 'image/webp';
    colorDepth = hasAlpha ? '32-bit RGBA' : '24-bit RGB';
    browserSupport = {
      chrome: 'Chrome 32+ (Universal)',
      safari: 'Safari 14+ (macOS Big Sur+ / iOS 14+)',
      firefox: 'Firefox 65+ (Universal)',
      edge: 'Edge 18+ (Universal)',
      iosSafari: 'iOS 14+ Supported',
      androidChrome: 'Android 4.0+ Supported',
    };
    recommendation = 'Modern high-efficiency format offering superior compression for both lossy and lossless graphics.';
  }

  // 4. GIF (47 49 46 38 37 61 or 47 49 46 38 39 61)
  else if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    const version = bytes[4] === 0x39 ? 'GIF89a' : 'GIF87a';
    // Count image separators (0x2C) to detect animation
    let imageDescriptors = 0;
    for (let i = 10; i < bytes.length - 9; i++) {
      if (bytes[i] === 0x2c) imageDescriptors++;
    }
    isAnimated = imageDescriptors > 1;

    detectedFormat = isAnimated ? 'GIF (Animated Graphics Interchange Format)' : 'GIF (Static 8-bit Graphic)';
    shortName = 'GIF';
    actualExtension = '.gif';
    mimeType = 'image/gif';
    compressionType = 'Lossless';
    hasAlpha = true; // 1-bit binary transparency supported
    colorDepth = '8-bit Indexed Color (Max 256 colors)';
    containerInfo = `Compuserve ${version} Container`;
    browserSupport = {
      chrome: 'Universal (All versions)',
      safari: 'Universal (All versions)',
      firefox: 'Universal (All versions)',
      edge: 'Universal (All versions)',
      iosSafari: 'Universal (All versions)',
      androidChrome: 'Universal (All versions)',
    };
    recommendation = isAnimated
      ? 'Legacy animated format. Converting to animated WebP or MP4 video yields up to 80-90% smaller file sizes.'
      : 'Legacy indexed image. PNG or WebP provides better color reproduction and smaller file size.';
  }

  // 5. AVIF (ISO BMFF ftypavif or ftypavis)
  else if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    const brand = bufferToAscii(buffer, 8, 4);
    const compatible = bufferToAscii(buffer, 16, 24);

    if (brand === 'avif' || brand === 'avis' || compatible.includes('avif')) {
      isAnimated = brand === 'avis' || compatible.includes('avis');
      detectedFormat = isAnimated ? 'AVIF (Animated AV1 Image File Format)' : 'AVIF (AV1 Image File Format)';
      shortName = 'AVIF';
      actualExtension = '.avif';
      mimeType = 'image/avif';
      compressionType = 'Lossy';
      hasAlpha = true;
      colorDepth = '10-bit / 12-bit HDR / Wide Color Gamut';
      containerInfo = 'ISO Base Media File Format (ISOBMFF / AV1 Video Codec)';
      browserSupport = {
        chrome: 'Chrome 85+',
        safari: 'Safari 16+ (iOS 16+ / macOS 13+)',
        firefox: 'Firefox 93+',
        edge: 'Edge 121+',
        iosSafari: 'iOS 16+ Supported',
        androidChrome: 'Chrome Android 85+',
      };
      recommendation = 'Cutting-edge next-generation format delivering up to 50% better compression than JPEG with HDR color.';
    }
    // 6. HEIC / HEIF (ftypheic / ftypmif1 / ftypheix)
    else if (
      brand === 'heic' ||
      brand === 'heix' ||
      brand === 'mif1' ||
      brand === 'msf1' ||
      compatible.includes('heic')
    ) {
      detectedFormat = 'HEIC / HEIF (High Efficiency Image Container)';
      shortName = 'HEIC';
      actualExtension = '.heic';
      mimeType = 'image/heic';
      compressionType = 'Lossy';
      hasAlpha = true;
      colorDepth = '10-bit / 16-bit High Dynamic Range';
      containerInfo = 'ISO BMFF (HEVC / H.265 Codec)';
      browserSupport = {
        chrome: 'Partial (Native Android/Chromium)',
        safari: 'Safari 11+ (Native Apple Ecosystem)',
        firefox: 'Limited (Platform dependent)',
        edge: 'Requires HEVC extension',
        iosSafari: 'iOS 11+ Supported natively',
        androidChrome: 'Android 10+ Supported',
      };
      recommendation = 'Apple iOS standard photo format. Convert to JPEG or WebP for universal web and Windows compatibility.';
    }
  }

  // 7. SVG (XML text based)
  else {
    const textSample = bufferToAscii(buffer, 0, Math.min(buffer.byteLength, 1024)).trim();
    if (
      textSample.startsWith('<svg') ||
      (textSample.startsWith('<?xml') && textSample.includes('<svg')) ||
      textSample.includes('xmlns="http://www.w3.org/2000/svg"')
    ) {
      detectedFormat = 'SVG (Scalable Vector Graphics)';
      shortName = 'SVG';
      actualExtension = '.svg';
      mimeType = 'image/svg+xml';
      compressionType = 'Vector';
      hasAlpha = true;
      isAnimated = textSample.includes('<animate') || textSample.includes('animation');
      colorDepth = 'Infinite Precision Vector Curves';
      containerInfo = 'XML-based Vector Document';
      browserSupport = {
        chrome: 'Universal (All versions)',
        safari: 'Universal (All versions)',
        firefox: 'Universal (All versions)',
        edge: 'Universal (All versions)',
        iosSafari: 'Universal (All versions)',
        androidChrome: 'Universal (All versions)',
      };
      recommendation = 'Resolution-independent vector graphic. Scalable to any dimension without losing crispness; ideal for logos and icons.';
    }
    // 8. BMP (42 4D "BM")
    else if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
      detectedFormat = 'BMP (Windows Bitmap)';
      shortName = 'BMP';
      actualExtension = '.bmp';
      mimeType = 'image/bmp';
      compressionType = 'Uncompressed';
      hasAlpha = false;
      colorDepth = '24-bit Truecolor (Uncompressed Raster)';
      containerInfo = 'Microsoft Windows Bitmap DIB';
      browserSupport = {
        chrome: 'Universal',
        safari: 'Universal',
        firefox: 'Universal',
        edge: 'Universal',
        iosSafari: 'Universal',
        androidChrome: 'Universal',
      };
      recommendation = 'Uncompressed raster bitmap. Convert to WebP, PNG, or JPEG to reduce file size by 90%+ without quality loss.';
    }
    // 9. TIFF (49 49 2A 00 or 4D 4D 00 2A)
    else if (
      bytes.length >= 4 &&
      ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
        (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a))
    ) {
      detectedFormat = 'TIFF (Tagged Image File Format)';
      shortName = 'TIFF';
      actualExtension = '.tiff';
      mimeType = 'image/tiff';
      compressionType = 'Lossless';
      hasAlpha = true;
      colorDepth = '24-bit / 48-bit High Bit-Depth';
      containerInfo = 'Aldus / Adobe Tagged Image Container';
      browserSupport = {
        chrome: 'No native web rendering',
        safari: 'Safari desktop supported',
        firefox: 'No native web rendering',
        edge: 'No native web rendering',
        iosSafari: 'Limited',
        androidChrome: 'No native web rendering',
      };
      recommendation = 'Professional archival and print format. Convert to JPEG or WebP for web publishing.';
    }
    // 10. ICO (00 00 01 00)
    else if (
      bytes.length >= 4 &&
      bytes[0] === 0x00 &&
      bytes[1] === 0x00 &&
      bytes[2] === 0x01 &&
      bytes[3] === 0x00
    ) {
      detectedFormat = 'ICO (Windows Favicon / Icon)';
      shortName = 'ICO';
      actualExtension = '.ico';
      mimeType = 'image/x-icon';
      compressionType = 'Lossless';
      hasAlpha = true;
      colorDepth = '32-bit RGBA Favicon Container';
      containerInfo = 'Windows Icon Resource';
      browserSupport = {
        chrome: 'Universal',
        safari: 'Universal',
        firefox: 'Universal',
        edge: 'Universal',
        iosSafari: 'Universal',
        androidChrome: 'Universal',
      };
      recommendation = 'Standard browser favicon format. Modern websites also support SVG and PNG favicons.';
    }
    // 11. PSD (38 42 50 53 "8BPS")
    else if (
      bytes.length >= 4 &&
      bytes[0] === 0x38 &&
      bytes[1] === 0x42 &&
      bytes[2] === 0x50 &&
      bytes[3] === 0x53
    ) {
      detectedFormat = 'PSD (Adobe Photoshop Document)';
      shortName = 'PSD';
      actualExtension = '.psd';
      mimeType = 'image/vnd.adobe.photoshop';
      compressionType = 'Lossless';
      hasAlpha = true;
      colorDepth = 'Multi-layer 8-bit / 16-bit / 32-bit';
      containerInfo = 'Adobe Photoshop Layered Project File';
      browserSupport = {
        chrome: 'No web browser support',
        safari: 'No web browser support',
        firefox: 'No web browser support',
        edge: 'No web browser support',
        iosSafari: 'No web browser support',
        androidChrome: 'No web browser support',
      };
      recommendation = 'Proprietary Adobe design file. Export layers to PNG, WebP, or JPEG for web sharing.';
    }
  }

  // Measure Dimensions via HTMLImageElement (if viewable)
  let width = 0;
  let height = 0;

  try {
    const img = new Image();
    const loadPromise = new Promise<{ w: number; h: number }>((resolve) => {
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 0, h: 0 });
    });
    img.src = previewUrl;
    const dims = await loadPromise;
    width = dims.w;
    height = dims.h;
  } catch {
    // Non-renderable format (e.g. PSD/TIFF)
  }

  // Compare declared extension vs actual format
  const normDeclared = declaredExt.toLowerCase().replace('.', '');
  const normActual = actualExtension.toLowerCase().replace('.', '');

  let isExtensionMismatch = false;
  if (normDeclared && normActual) {
    if (
      (normDeclared === 'jpg' || normDeclared === 'jpeg') &&
      (normActual === 'jpg' || normActual === 'jpeg')
    ) {
      isExtensionMismatch = false;
    } else if (
      (normDeclared === 'tif' || normDeclared === 'tiff') &&
      (normActual === 'tif' || normActual === 'tiff')
    ) {
      isExtensionMismatch = false;
    } else {
      isExtensionMismatch = normDeclared !== normActual;
    }
  }

  return {
    name: file.name,
    fileSize: file.size,
    fileSizeFormatted: formatBytes(file.size),
    declaredExtension: declaredExt || '(None)',
    actualExtension,
    isExtensionMismatch,
    detectedFormat,
    shortName,
    mimeType,
    hexSignature: hexSig,
    containerInfo,
    compressionType,
    hasAlpha,
    isAnimated,
    width,
    height,
    aspectRatio: getAspectRatio(width, height),
    colorDepth,
    previewUrl,
    browserSupport,
    recommendation,
  };
}

/**
 * 1-Click Interactive In-Browser Sample Image Generators
 */
export async function generateSampleWebp(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 600, 400);
  grad.addColorStop(0, '#6366f1');
  grad.addColorStop(1, '#ec4899');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 400);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WebP Sample Image (VP8X)', 300, 190);
  ctx.font = '16px sans-serif';
  ctx.fillText('High Efficiency WebP Format', 300, 230);

  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/webp', 0.9));
  return new File([blob], 'sample-image.webp', { type: 'image/webp' });
}

export async function generateSamplePng(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;
  const ctx = canvas.getContext('2d')!;

  // Transparent background
  ctx.clearRect(0, 0, 500, 500);

  // Draw circle
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(250, 250, 180, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PNG with Alpha', 250, 240);
  ctx.font = '16px sans-serif';
  ctx.fillText('Transparent RGBA', 250, 275);

  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  return new File([blob], 'sample-transparent.png', { type: 'image/png' });
}

export function generateSampleSvg(): File {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300" width="500" height="300">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
  </defs>
  <rect width="500" height="300" rx="20" fill="url(#g)" />
  <circle cx="100" cy="150" r="40" fill="#ffffff" opacity="0.2" />
  <circle cx="400" cy="150" r="50" fill="#ffffff" opacity="0.15" />
  <text x="250" y="145" font-family="sans-serif" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle">SVG Vector Graphic</text>
  <text x="250" y="185" font-family="sans-serif" font-size="16" fill="#e0e7ff" text-anchor="middle">XML-Based Scalable Curves</text>
</svg>`;
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  return new File([blob], 'vector-sample.svg', { type: 'image/svg+xml' });
}

export async function generateSampleMismatched(): Promise<File> {
  // Generates a real WebP image but intentionally names it .jpg to test mismatch detection
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, 400, 400);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Mismatched File Test', 200, 190);
  ctx.font = '14px sans-serif';
  ctx.fillText('(Real WebP Named as .JPG)', 200, 225);

  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/webp', 0.85));
  return new File([blob], 'fake-extension-test.jpg', { type: 'image/jpeg' });
}
