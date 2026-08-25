/**
 * ImgFeel Image to Text (OCR) Engine
 * 100% Client-side Optical Character Recognition, dynamic Tesseract loader,
 * canvas image preprocessing (contrast, binarization, grayscale),
 * real-time progress tracking, and text analytics.
 */

export interface OcrProgress {
  status: string;
  progress: number; // 0.0 to 1.0
}

export interface TextMetrics {
  words: number;
  charsWithSpaces: number;
  charsNoSpaces: number;
  lines: number;
}

export interface OcrResult {
  text: string;
  confidence: number;
  metrics: TextMetrics;
}

declare global {
  interface Window {
    Tesseract?: any;
  }
}

export class ImageToTextEngine {
  private tesseractLoaded = false;
  private isBusy = false;

  /**
   * Dynamically load Tesseract.js from CDN on demand
   */
  public async loadTesseract(): Promise<void> {
    if (this.tesseractLoaded && window.Tesseract) return;

    if (window.Tesseract) {
      this.tesseractLoaded = true;
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.async = true;
      script.onload = () => {
        this.tesseractLoaded = true;
        resolve();
      };
      script.onerror = () => {
        // Fallback CDN
        const fallback = document.createElement('script');
        fallback.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.5/tesseract.min.js';
        fallback.onload = () => {
          this.tesseractLoaded = true;
          resolve();
        };
        fallback.onerror = () => reject(new Error('Failed to load OCR engine. Please check your internet connection.'));
        document.head.appendChild(fallback);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Preprocess image on canvas to dramatically improve OCR accuracy
   */
  public preprocessImage(
    img: HTMLImageElement,
    enhanceContrast = true
  ): string {
    const canvas = document.createElement('canvas');
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    // Scale up small images for better OCR character recognition
    if (width < 1000 && height < 1000) {
      const scale = 2;
      width *= scale;
      height *= scale;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return img.src;

    ctx.drawImage(img, 0, 0, width, height);

    if (enhanceContrast) {
      const imgData = ctx.getImageData(0, 0, width, height);
      const d = imgData.data;

      // 1. Grayscale & Contrast Enhancement
      // High-pass contrast adjustment
      const contrastFactor = 1.35; // 35% contrast boost
      const intercept = 128 * (1 - contrastFactor);

      for (let i = 0; i < d.length; i += 4) {
        // Luminance grayscale
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        
        // Contrast enhancement
        let c = gray * contrastFactor + intercept;
        if (c < 0) c = 0;
        if (c > 255) c = 255;

        // Subtle binarization threshold assist for faint text
        if (c > 175) c = 255; // clean white background
        else if (c < 80) c = 0; // deep black text

        d[i] = c;
        d[i + 1] = c;
        d[i + 2] = c;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    return canvas.toDataURL('image/png');
  }

  /**
   * Compute text statistics
   */
  public static calculateMetrics(text: string): TextMetrics {
    const trimmed = text.trim();
    if (!trimmed) {
      return { words: 0, charsWithSpaces: 0, charsNoSpaces: 0, lines: 0 };
    }

    const words = trimmed.split(/\s+/).filter(Boolean).length;
    const charsWithSpaces = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const lines = text.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0).length;

    return { words, charsWithSpaces, charsNoSpaces, lines };
  }

  /**
   * Run OCR text recognition on image
   */
  public async recognizeText(
    imageSource: string | HTMLImageElement | File,
    lang = 'eng',
    enhance = true,
    onProgress?: (progress: OcrProgress) => void
  ): Promise<OcrResult> {
    if (this.isBusy) {
      throw new Error('OCR process already running.');
    }

    this.isBusy = true;
    try {
      if (onProgress) onProgress({ status: 'Loading OCR engine...', progress: 0.1 });
      await this.loadTesseract();

      let targetSource: any = imageSource;

      // If image element, preprocess
      if (imageSource instanceof HTMLImageElement && enhance) {
        if (onProgress) onProgress({ status: 'Enhancing image contrast...', progress: 0.2 });
        targetSource = this.preprocessImage(imageSource, true);
      } else if (imageSource instanceof File && enhance) {
        if (onProgress) onProgress({ status: 'Preprocessing document...', progress: 0.2 });
        const img = await this.fileToImage(imageSource);
        targetSource = this.preprocessImage(img, true);
      }

      if (onProgress) onProgress({ status: 'Analyzing characters & layout...', progress: 0.35 });

      const worker = await window.Tesseract.createWorker(lang, 1, {
        logger: (m: any) => {
          if (m.status && onProgress) {
            let p = 0.35;
            if (m.status === 'recognizing text') {
              p = 0.4 + (m.progress || 0) * 0.55;
            }
            onProgress({ status: m.status, progress: Math.min(0.95, p) });
          }
        },
      });

      const ret = await worker.recognize(targetSource);
      await worker.terminate();

      if (onProgress) onProgress({ status: 'Complete!', progress: 1.0 });

      const rawText = (ret.data && ret.data.text) ? ret.data.text : '';
      const confidence = (ret.data && ret.data.confidence) ? Math.round(ret.data.confidence) : 90;
      const metrics = ImageToTextEngine.calculateMetrics(rawText);

      this.isBusy = false;
      return { text: rawText, confidence, metrics };
    } catch (err: any) {
      this.isBusy = false;
      throw err;
    }
  }

  private fileToImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image.'));
      };
      img.src = url;
    });
  }

  /**
   * Generate realistic demo document with crisp text for 1-click test
   */
  public generateSampleDocument(): Promise<{ file: File; dataUrl: string }> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 2000;
      const ctx = canvas.getContext('2d')!;

      // Paper background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1600, 2000);

      // Border & Header box
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 4;
      ctx.strokeRect(60, 60, 1480, 1880);

      ctx.fillStyle = '#4F46E5';
      ctx.fillRect(100, 100, 1400, 140);

      // Header Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 54px system-ui, -apple-system, sans-serif';
      ctx.fillText('OFFICIAL INVOICE & RECEIPT', 150, 190);

      // Metadata
      ctx.fillStyle = '#475569';
      ctx.font = '600 32px system-ui, -apple-system, sans-serif';
      ctx.fillText('Invoice Number: INV-2026-8942', 120, 310);
      ctx.fillText('Date: August 25, 2026', 120, 360);
      ctx.fillText('Customer: Global Tech Enterprises Ltd.', 120, 410);

      // Divider Line
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(120, 460);
      ctx.lineTo(1480, 460);
      ctx.stroke();

      // Description & Table Header
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
      ctx.fillText('Service Description', 120, 540);
      ctx.fillText('Qty', 950, 540);
      ctx.fillText('Price', 1150, 540);
      ctx.fillText('Total', 1350, 540);

      // Items
      ctx.font = '400 32px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#334155';

      const items = [
        ['1. Cloud Storage & CDN Hosting Tier 1', '1', '$120.00', '$120.00'],
        ['2. High-Speed Image Processing Engine', '5', '$45.00', '$225.00'],
        ['3. Automated WebP Asset Compression', '1', '$80.00', '$80.00'],
        ['4. SSL Security & Dedicated Domain Setup', '1', '$95.00', '$95.00'],
        ['5. Premium Multi-Region Load Balancer', '2', '$60.00', '$120.00'],
      ];

      let y = 620;
      items.forEach((item) => {
        ctx.fillText(item[0], 120, y);
        ctx.fillText(item[1], 960, y);
        ctx.fillText(item[2], 1140, y);
        ctx.fillText(item[3], 1340, y);
        y += 80;
      });

      // Divider
      ctx.beginPath();
      ctx.moveTo(120, 1060);
      ctx.lineTo(1480, 1060);
      ctx.stroke();

      // Totals
      ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText('Subtotal:', 1100, 1140);
      ctx.fillText('$640.00', 1340, 1140);
      ctx.fillText('Tax (8%):', 1100, 1200);
      ctx.fillText('$51.20', 1340, 1200);
      ctx.fillStyle = '#4F46E5';
      ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
      ctx.fillText('Grand Total:', 1020, 1280);
      ctx.fillText('$691.20', 1340, 1280);

      // Footer Notes
      ctx.fillStyle = '#64748B';
      ctx.font = 'italic 28px system-ui, -apple-system, sans-serif';
      ctx.fillText('Thank you for your business! Payment is due within 30 days.', 120, 1420);
      ctx.fillText('For support inquiries, please contact support@imgfeel.com', 120, 1470);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      canvas.toBlob((blob) => {
        const file = new File([blob!], 'sample-invoice-document.jpg', { type: 'image/jpeg' });
        resolve({ file, dataUrl });
      }, 'image/jpeg', 0.95);
    });
  }
}
