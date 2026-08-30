/**
 * Client-Side Engine for Pixel Counter Online
 * 100% in-browser processing with zero server uploads, instant dimension inspection, and total pixel calculations.
 */

export interface PixelMetrics {
  file?: File;
  fileName: string;
  fileSizeBytes: number;
  formattedFileSize: string;
  mimeType: string;
  formatName: string;
  width: number;
  height: number;
  totalPixels: number;
  formattedTotalPixels: string;
  megapixels: number;
  formattedMegapixels: string;
  aspectRatioStr: string;
  aspectRatioDecimal: string;
  orientation: 'landscape' | 'portrait' | 'square';
  rawMemoryBytes: number;
  formattedRawMemory: string;
  previewUrl: string;
}

export class PixelCounterEngine {
  /**
   * Greatest Common Divisor helper to compute simplified aspect ratio
   */
  static gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  /**
   * Determine user-friendly format name from MIME and filename extension
   */
  static detectFormat(fileName: string, mimeType: string): string {
    const ext = fileName.split('.').pop()?.toUpperCase() || '';
    if (mimeType.includes('png') || ext === 'PNG') return 'PNG';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg') || ext === 'JPG' || ext === 'JPEG') return 'JPEG';
    if (mimeType.includes('webp') || ext === 'WEBP') return 'WebP';
    if (mimeType.includes('avif') || ext === 'AVIF') return 'AVIF';
    if (mimeType.includes('gif') || ext === 'GIF') return 'GIF';
    if (mimeType.includes('svg') || ext === 'SVG') return 'SVG';
    if (mimeType.includes('bmp') || ext === 'BMP') return 'BMP';
    if (mimeType.includes('tiff') || ext === 'TIFF' || ext === 'TIF') return 'TIFF';
    if (mimeType.includes('ico') || ext === 'ICO') return 'ICO';
    return ext || 'IMAGE';
  }

  /**
   * Format bytes to human readable string (KB, MB)
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Format integer with thousands separators
   */
  static formatNumber(num: number): string {
    return num.toLocaleString('en-US');
  }

  /**
   * Calculate simplified aspect ratio string and decimal
   */
  static calculateAspectRatio(width: number, height: number): { ratioStr: string; decimal: string; orientation: 'landscape' | 'portrait' | 'square' } {
    if (width <= 0 || height <= 0) {
      return { ratioStr: '1:1', decimal: '1.00:1', orientation: 'square' };
    }

    const divisor = this.gcd(width, height);
    let rW = width / divisor;
    let rH = height / divisor;

    // Detect common standard photography/screen aspect ratios with slight tolerance
    const dec = width / height;
    let standardLabel = `${rW}:${rH}`;

    if (Math.abs(dec - 16 / 9) < 0.015) standardLabel = '16:9';
    else if (Math.abs(dec - 4 / 3) < 0.015) standardLabel = '4:3';
    else if (Math.abs(dec - 1) < 0.01) standardLabel = '1:1';
    else if (Math.abs(dec - 9 / 16) < 0.015) standardLabel = '9:16';
    else if (Math.abs(dec - 4 / 5) < 0.015) standardLabel = '4:5';
    else if (Math.abs(dec - 3 / 2) < 0.015) standardLabel = '3:2';
    else if (Math.abs(dec - 2 / 3) < 0.015) standardLabel = '2:3';
    else if (Math.abs(dec - 21 / 9) < 0.02) standardLabel = '21:9';

    let orientation: 'landscape' | 'portrait' | 'square' = 'square';
    if (width > height) orientation = 'landscape';
    else if (height > width) orientation = 'portrait';

    return {
      ratioStr: standardLabel,
      decimal: `${dec.toFixed(2)}:1`,
      orientation,
    };
  }

  /**
   * Inspect an uploaded File object and return complete pixel and format metrics
   */
  static async inspectFile(file: File): Promise<PixelMetrics> {
    const previewUrl = URL.createObjectURL(file);
    const dims = await this.loadImageDimensions(previewUrl);

    const width = dims.width;
    const height = dims.height;
    const totalPixels = width * height;
    const megapixels = parseFloat((totalPixels / 1000000).toFixed(2));
    const { ratioStr, decimal, orientation } = this.calculateAspectRatio(width, height);
    const formatName = this.detectFormat(file.name, file.type || '');
    const rawMemoryBytes = width * height * 4; // 32-bit RGBA

    return {
      file,
      fileName: file.name,
      fileSizeBytes: file.size,
      formattedFileSize: this.formatBytes(file.size),
      mimeType: file.type || 'image/jpeg',
      formatName,
      width,
      height,
      totalPixels,
      formattedTotalPixels: this.formatNumber(totalPixels),
      megapixels,
      formattedMegapixels: `${megapixels} MP`,
      aspectRatioStr: ratioStr,
      aspectRatioDecimal: decimal,
      orientation,
      rawMemoryBytes,
      formattedRawMemory: this.formatBytes(rawMemoryBytes),
      previewUrl,
    };
  }

  /**
   * Load image and resolve natural pixel dimensions
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
   * Generate an ultra-clean 1920x1080 (Full HD, 2,073,600 Pixels) sample image
   */
  static async generateSampleImage(): Promise<File> {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context could not be initialized');
    }

    // Modern vibrant gradient
    const grad = ctx.createLinearGradient(0, 0, 1920, 1080);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#312e81');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1920, 1080);

    // Subtle decorative grid lines representing pixels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1920; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1080);
      ctx.stroke();
    }
    for (let y = 0; y < 1080; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1920, y);
      ctx.stroke();
    }

    // Center glowing hero container card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(460, 290, 1000, 500, 24);
    ctx.fill();
    ctx.stroke();

    // Top badge
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.roundRect(835, 340, 250, 44, 22);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FULL HD 1080P SAMPLE', 960, 362);

    // Main dimensions text
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 68px Inter, system-ui, sans-serif';
    ctx.fillText('1920 × 1080 px', 960, 450);

    // Total pixel count highlight
    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 38px Inter, system-ui, sans-serif';
    ctx.fillText('Total Pixels: 2,073,600 (2.07 MP)', 960, 530);

    // Metadata subtext
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '500 22px Inter, system-ui, sans-serif';
    ctx.fillText('Aspect Ratio: 16:9 • 100% In-Browser Inspection • ImgFeel', 960, 610);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
    if (!blob) {
      throw new Error('Failed to generate sample image blob');
    }

    return new File([blob], 'sample-1920x1080.jpg', { type: 'image/jpeg' });
  }
}
