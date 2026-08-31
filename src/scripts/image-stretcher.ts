export interface StretcherState {
  file: File | null;
  img: HTMLImageElement | null;
  originalWidth: number;
  originalHeight: number;
  originalSizeBytes: number;
  formattedOriginalSize: string;
  name: string;
  extension: string;
  mimeType: string;
  currentWidth: number;
  currentHeight: number;
  lockAspectRatio: boolean;
  quality: number;
  previewUrl: string | null;
}

export class ImageStretcherEngine {
  /**
   * Format byte count to human-readable size
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Read natural dimensions from an image URL
   */
  static getImageDimensions(url: string): Promise<{ width: number; height: number; img: HTMLImageElement }> {
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
   * Inspect uploaded File and prepare initial stretcher state
   */
  static async loadFile(file: File): Promise<StretcherState> {
    const originalName = file.name;
    const lastDot = originalName.lastIndexOf('.');
    let baseName = originalName;
    let extension = 'jpg';

    if (lastDot > 0) {
      baseName = originalName.substring(0, lastDot);
      extension = originalName.substring(lastDot + 1).toLowerCase();
    }

    const previewUrl = URL.createObjectURL(file);
    const { width, height, img } = await this.getImageDimensions(previewUrl);

    return {
      file,
      img,
      originalWidth: width,
      originalHeight: height,
      originalSizeBytes: file.size,
      formattedOriginalSize: this.formatBytes(file.size),
      name: baseName,
      extension: extension === 'jpeg' ? 'jpg' : extension,
      mimeType: file.type || 'image/jpeg',
      currentWidth: width,
      currentHeight: height,
      lockAspectRatio: false, // OFF by default so user can stretch
      quality: 0.92,
      previewUrl,
    };
  }

  /**
   * Generate an attractive demo sample image to test stretching
   */
  static async generateSampleImage(): Promise<File> {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }

    // Modern vibrant gradient
    const grad = ctx.createLinearGradient(0, 0, 1200, 800);
    grad.addColorStop(0, '#3b82f6');
    grad.addColorStop(0.5, '#6366f1');
    grad.addColorStop(1, '#ec4899');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 800);

    // Decorative geometric shapes to demonstrate stretching
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(300, 400, 180, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 12;
    ctx.strokeRect(700, 250, 300, 300);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ImgFeel Image Stretcher', 600, 370);

    ctx.font = '500 28px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('Original 1200 × 800 px (3:2 Aspect Ratio)', 600, 440);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Sample blob failed'))), 'image/jpeg', 0.92);
    });

    return new File([blob], 'sample_stretch_demo.jpg', { type: 'image/jpeg' });
  }

  /**
   * Render final stretched image onto a high-quality Canvas and produce downloadable Blob
   */
  static async exportStretchedImage(
    img: HTMLImageElement,
    targetWidth: number,
    targetHeight: number,
    mimeType: string,
    quality: number = 0.92
  ): Promise<{ blob: Blob; width: number; height: number; sizeBytes: number; formattedSize: string }> {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(targetWidth));
    canvas.height = Math.max(1, Math.round(targetHeight));
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // White background for JPEG if transparency
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to generate export blob'))),
        mimeType,
        mimeType !== 'image/png' ? quality : undefined
      );
    });

    return {
      blob,
      width: canvas.width,
      height: canvas.height,
      sizeBytes: blob.size,
      formattedSize: this.formatBytes(blob.size),
    };
  }

  /**
   * Download a Blob as a file in the browser
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
}
