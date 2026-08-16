/**
 * ImgFeel.com — Image Dimensions Checker Engine
 * 100% Client-Side Pure TypeScript Image Analysis & Metadata Inspector
 */

interface ExifData {
  make?: string;
  model?: string;
  dateTime?: string;
  exposureTime?: string;
  fNumber?: string;
  iso?: number;
  focalLength?: string;
  flash?: string;
  lensModel?: string;
  software?: string;
  hasGps?: boolean;
}

interface ImageInspectionResult {
  fileName: string;
  fileSize: number; // bytes
  mimeType: string;
  width: number;
  height: number;
  totalPixels: number;
  megapixels: number;
  aspectRatio: string;
  decimalRatio: number;
  orientation: 'Landscape' | 'Portrait' | 'Square';
  hasAlpha: boolean;
  bitsPerPixel: number;
  standardMatch: string | null;
  exif: ExifData;
  embeddedDpi: number | null;
  dominantColor: string;
  palette: string[];
  dataUrl: string;
}

class DimensionsChecker {
  private root: HTMLElement;
  private dropzone: HTMLElement;
  private fileInput: HTMLInputElement;
  private sampleBtn: HTMLButtonElement | null;
  private uploadView: HTMLElement;
  private editorView: HTMLElement;
  private previewImg: HTMLImageElement;
  private errorView: HTMLElement;
  private errorMsg: HTMLElement;
  
  // DPI Calculator inputs
  private dpiSelect: HTMLSelectElement | null;
  private customDpiGroup: HTMLElement | null;
  private customDpiInput: HTMLInputElement | null;
  private printInches: HTMLElement | null;
  private printCm: HTMLElement | null;
  private printMm: HTMLElement | null;

  // Actions
  private btnCopySpecs: HTMLButtonElement | null;
  private btnCopyDimensions: HTMLButtonElement | null;
  private btnNewImage: HTMLButtonElement | null;

  // Current State
  private currentResult: ImageInspectionResult | null = null;
  private currentDpi: number = 300;

  constructor(root: HTMLElement) {
    this.root = root;
    this.dropzone = root.querySelector('#dim-dropzone') as HTMLElement;
    this.fileInput = root.querySelector('#dim-file-input') as HTMLInputElement;
    this.sampleBtn = root.querySelector('#dim-btn-sample') as HTMLButtonElement;
    this.uploadView = root.querySelector('#dim-upload') as HTMLElement;
    this.editorView = root.querySelector('#dim-editor') as HTMLElement;
    this.previewImg = root.querySelector('#dim-preview') as HTMLImageElement;
    this.errorView = root.querySelector('#dim-error') as HTMLElement;
    this.errorMsg = root.querySelector('#dim-error-msg') as HTMLElement;

    this.dpiSelect = root.querySelector('#dim-dpi-select') as HTMLSelectElement;
    this.customDpiGroup = root.querySelector('#dim-custom-dpi-group') as HTMLElement;
    this.customDpiInput = root.querySelector('#dim-custom-dpi-input') as HTMLInputElement;
    this.printInches = root.querySelector('#dim-print-in') as HTMLElement;
    this.printCm = root.querySelector('#dim-print-cm') as HTMLElement;
    this.printMm = root.querySelector('#dim-print-mm') as HTMLElement;

    this.btnCopySpecs = root.querySelector('#dim-btn-copy-specs') as HTMLButtonElement;
    this.btnCopyDimensions = root.querySelector('#dim-btn-copy-dim') as HTMLButtonElement;
    this.btnNewImage = root.querySelector('#dim-btn-new') as HTMLButtonElement;

    this.initEvents();
  }

  private initEvents(): void {
    // Dropzone Click
    this.dropzone?.addEventListener('click', () => {
      this.fileInput?.click();
    });

    // File Input Change
    this.fileInput?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) this.processFile(file);
    });

    // Drag & Drop
    ['dragenter', 'dragover'].forEach((eventName) => {
      this.dropzone?.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.add('dropzone-active');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      this.dropzone?.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.remove('dropzone-active');
      });
    });

    this.dropzone?.addEventListener('drop', (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (file) this.processFile(file);
    });

    // Global Paste Support (Ctrl+V / Cmd+V)
    document.addEventListener('paste', (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            this.processFile(file);
            break;
          }
        }
      }
    });

    // Sample Image Test
    this.sampleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.loadSampleImage();
    });

    // DPI Selector Change
    this.dpiSelect?.addEventListener('change', () => {
      const val = this.dpiSelect?.value;
      if (val === 'custom') {
        if (this.customDpiGroup) this.customDpiGroup.style.display = 'flex';
        this.currentDpi = parseInt(this.customDpiInput?.value || '300', 10) || 300;
      } else {
        if (this.customDpiGroup) this.customDpiGroup.style.display = 'none';
        this.currentDpi = parseInt(val || '300', 10) || 300;
      }
      this.updatePrintCalculations();
    });

    this.customDpiInput?.addEventListener('input', () => {
      const val = parseInt(this.customDpiInput?.value || '300', 10);
      this.currentDpi = Math.max(1, Math.min(2400, val || 300));
      this.updatePrintCalculations();
    });

    // Copy Actions
    this.btnCopySpecs?.addEventListener('click', () => this.copyAllSpecs());
    this.btnCopyDimensions?.addEventListener('click', () => this.copyDimensions());

    // New Image Reset
    this.btnNewImage?.addEventListener('click', () => this.reset());

    // Palette Color Copy Delegation
    this.root.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('.color-swatch-box') as HTMLElement;
      if (target && target.dataset.hex) {
        navigator.clipboard.writeText(target.dataset.hex);
        const tip = target.querySelector('.color-copied-tooltip') as HTMLElement;
        if (tip) {
          tip.classList.add('show');
          setTimeout(() => tip.classList.remove('show'), 1500);
        }
      }
    });
  }

  private showError(msg: string): void {
    if (this.errorMsg && this.errorView) {
      this.errorMsg.textContent = msg;
      this.errorView.hidden = false;
    }
  }

  private clearError(): void {
    if (this.errorView) this.errorView.hidden = true;
  }

  public reset(): void {
    this.currentResult = null;
    if (this.fileInput) this.fileInput.value = '';
    if (this.uploadView) this.uploadView.hidden = false;
    if (this.editorView) this.editorView.hidden = true;
    this.clearError();
  }

  private async loadSampleImage(): Promise<void> {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(0.5, '#3b82f6');
    gradient.addColorStop(1, '#10b981');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.arc(400, 300, 260, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(1500, 800, 420, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ImgFeel Sample Image', 960, 520);
    ctx.font = '32px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText('1920 × 1080 px • Full HD 16:9', 960, 580);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'sample-landscape-fhd.jpg', { type: 'image/jpeg' });
        this.processFile(file);
      }
    }, 'image/jpeg', 0.92);
  }

  public async processFile(file: File): Promise<void> {
    this.clearError();

    if (!file.type.startsWith('image/') && !file.name.match(/\.(jpg|jpeg|png|webp|gif|svg|avif|bmp|ico|tiff)$/i)) {
      this.showError('Please upload a valid image file (JPG, PNG, WebP, SVG, GIF, AVIF, BMP).');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const dataUrl = await this.fileToDataUrl(file);
      const img = await this.loadImage(dataUrl);

      // Extract properties
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const totalPixels = width * height;
      const megapixels = Number((totalPixels / 1_000_000).toFixed(2));
      const { ratioStr, decimalRatio } = this.calculateAspectRatio(width, height);
      const orientation = width > height ? 'Landscape' : width < height ? 'Portrait' : 'Square';
      const standardMatch = this.detectStandardMatch(width, height);
      const bitsPerPixel = Number(((file.size * 8) / totalPixels).toFixed(2));

      // Parse metadata
      let exif: ExifData = {};
      let embeddedDpi: number | null = null;

      if (file.type === 'image/jpeg' || file.name.match(/\.jpe?g$/i)) {
        exif = this.parseJpegExif(buffer);
      } else if (file.type === 'image/png' || file.name.match(/\.png$/i)) {
        embeddedDpi = this.parsePngDpi(buffer);
      }

      // Analyze transparency and colors via canvas
      const { hasAlpha, dominantColor, palette } = this.analyzeCanvasProperties(img, width, height);

      this.currentResult = {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'image/unknown',
        width,
        height,
        totalPixels,
        megapixels,
        aspectRatio: ratioStr,
        decimalRatio,
        orientation,
        hasAlpha,
        bitsPerPixel,
        standardMatch,
        exif,
        embeddedDpi,
        dominantColor,
        palette,
        dataUrl,
      };

      this.renderResults();
    } catch (err: any) {
      console.error(err);
      this.showError(`Could not inspect image: ${err?.message || 'Invalid or corrupted image data.'}`);
    }
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to render image in browser.'));
      img.src = url;
    });
  }

  private calculateAspectRatio(w: number, h: number): { ratioStr: string; decimalRatio: number } {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(w, h);
    const rW = w / divisor;
    const rH = h / divisor;
    const decimalRatio = Number((w / h).toFixed(2));

    const ratio = w / h;
    const tolerance = 0.015;

    let common = `${rW}:${rH}`;
    if (Math.abs(ratio - 16 / 9) < tolerance) common = '16:9';
    else if (Math.abs(ratio - 9 / 16) < tolerance) common = '9:16';
    else if (Math.abs(ratio - 4 / 3) < tolerance) common = '4:3';
    else if (Math.abs(ratio - 3 / 4) < tolerance) common = '3:4';
    else if (Math.abs(ratio - 3 / 2) < tolerance) common = '3:2';
    else if (Math.abs(ratio - 2 / 3) < tolerance) common = '2:3';
    else if (Math.abs(ratio - 1 / 1) < tolerance) common = '1:1';
    else if (Math.abs(ratio - 21 / 9) < tolerance) common = '21:9';
    else if (Math.abs(ratio - 5 / 4) < tolerance) common = '5:4';
    else if (Math.abs(ratio - 4 / 5) < tolerance) common = '4:5';

    return { ratioStr: common, decimalRatio };
  }

  private detectStandardMatch(w: number, h: number): string | null {
    const key = `${w}x${h}`;
    const standards: Record<string, string> = {
      '3840x2160': '4K Ultra HD (2160p)',
      '2560x1440': '2K Quad HD / YouTube Banner (1440p)',
      '1920x1080': 'Full HD (1080p 16:9)',
      '1280x720': 'HD (720p 16:9)',
      '1080x1080': 'Instagram Post (1:1 Square)',
      '1080x1350': 'Instagram Portrait (4:5)',
      '1080x1920': 'Instagram Story / Reel / TikTok (9:16)',
      '1200x630': 'Open Graph / Facebook Share (1.91:1)',
      '1200x675': 'X (Twitter) Post (16:9)',
      '1500x500': 'X (Twitter) Header (3:1)',
      '820x312': 'Facebook Cover Photo',
      '1000x1500': 'Pinterest Pin (2:3 Standard)',
      '800x600': 'SVGA Standard (4:3)',
      '400x400': 'Profile Picture Avatar (1:1)',
      '2480x3508': 'A4 Document @ 300 DPI',
      '3508x2480': 'A4 Landscape @ 300 DPI',
    };
    return standards[key] || null;
  }

  private analyzeCanvasProperties(img: HTMLImageElement, w: number, h: number): {
    hasAlpha: boolean;
    dominantColor: string;
    palette: string[];
  } {
    const canvas = document.createElement('canvas');
    const sampleW = Math.min(100, w);
    const sampleH = Math.min(100, h);
    canvas.width = sampleW;
    canvas.height = sampleH;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return { hasAlpha: false, dominantColor: '#6366f1', palette: ['#6366f1', '#4f46e5', '#3b82f6', '#10b981', '#f59e0b'] };
    }

    ctx.drawImage(img, 0, 0, sampleW, sampleH);
    const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;

    let hasAlpha = false;
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    const colorBuckets: Map<string, number> = new Map();

    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const a = imgData[i + 3];

      if (a < 250) {
        hasAlpha = true;
      }

      if (a > 20) {
        rSum += r;
        gSum += g;
        bSum += b;
        count++;

        const qR = Math.round(r / 32) * 32;
        const qG = Math.round(g / 32) * 32;
        const qB = Math.round(b / 32) * 32;
        const hexKey = this.rgbToHex(qR, qG, qB);
        colorBuckets.set(hexKey, (colorBuckets.get(hexKey) || 0) + 1);
      }
    }

    const avgR = count > 0 ? Math.round(rSum / count) : 0;
    const avgG = count > 0 ? Math.round(gSum / count) : 0;
    const avgB = count > 0 ? Math.round(bSum / count) : 0;
    const dominantColor = this.rgbToHex(avgR, avgG, avgB);

    const sortedColors = Array.from(colorBuckets.entries())
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0]);

    const palette = sortedColors.slice(0, 5);
    while (palette.length < 5) {
      palette.push(dominantColor);
    }

    return { hasAlpha, dominantColor, palette };
  }

  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private parseJpegExif(buffer: ArrayBuffer): ExifData {
    const exif: ExifData = {};
    const view = new DataView(buffer);

    if (view.getUint16(0) !== 0xFFD8) return exif;

    let offset = 2;
    const length = view.byteLength;

    while (offset < length - 2) {
      const marker = view.getUint16(offset);
      offset += 2;

      if (marker === 0xFFE1) {
        const tiffStart = offset + 8;
        if (offset + 6 < view.byteLength && view.getUint32(offset + 2) === 0x45786966) {
          const isLittle = view.getUint16(tiffStart) === 0x4949;

          const getU16 = (pos: number) => view.getUint16(tiffStart + pos, isLittle);
          const getU32 = (pos: number) => view.getUint32(tiffStart + pos, isLittle);

          const ifd0Offset = getU32(4);
          const ifd0Count = getU16(ifd0Offset);
          let subIfdOffset = 0;
          let gpsIfdOffset = 0;

          for (let i = 0; i < ifd0Count; i++) {
            const entryOffset = ifd0Offset + 2 + i * 12;
            if (entryOffset + 12 > view.byteLength - tiffStart) break;
            const tag = getU16(entryOffset);
            const valOffset = getU32(entryOffset + 8);

            if (tag === 0x010F) exif.make = this.readAscii(view, tiffStart + valOffset);
            if (tag === 0x0110) exif.model = this.readAscii(view, tiffStart + valOffset);
            if (tag === 0x0131) exif.software = this.readAscii(view, tiffStart + valOffset);
            if (tag === 0x0132) exif.dateTime = this.readAscii(view, tiffStart + valOffset);
            if (tag === 0x8769) subIfdOffset = valOffset;
            if (tag === 0x8825) gpsIfdOffset = valOffset;
          }

          if (gpsIfdOffset > 0) {
            exif.hasGps = true;
          }

          if (subIfdOffset > 0) {
            const subCount = getU16(subIfdOffset);
            for (let i = 0; i < subCount; i++) {
              const entryOffset = subIfdOffset + 2 + i * 12;
              if (entryOffset + 12 > view.byteLength - tiffStart) break;
              const tag = getU16(entryOffset);
              const valOffset = getU32(entryOffset + 8);

              if (tag === 0x829A) {
                const num = getU32(valOffset);
                const den = getU32(valOffset + 4);
                if (den > 0) exif.exposureTime = num === 1 ? `1/${Math.round(den / num)}s` : `${(num / den).toFixed(2)}s`;
              }
              if (tag === 0x829D) {
                const num = getU32(valOffset);
                const den = getU32(valOffset + 4);
                if (den > 0) exif.fNumber = `f/${(num / den).toFixed(1)}`;
              }
              if (tag === 0x8827) {
                exif.iso = getU16(entryOffset + 8);
              }
              if (tag === 0x920A) {
                const num = getU32(valOffset);
                const den = getU32(valOffset + 4);
                if (den > 0) exif.focalLength = `${(num / den).toFixed(1)} mm`;
              }
              if (tag === 0xA434) {
                exif.lensModel = this.readAscii(view, tiffStart + valOffset);
              }
            }
          }
        }
        break;
      } else if ((marker & 0xFF00) === 0xFF00 && marker !== 0xFFD8 && marker !== 0xFFD9) {
        const segLen = view.getUint16(offset);
        offset += segLen;
      } else {
        break;
      }
    }

    return exif;
  }

  private readAscii(view: DataView, offset: number, maxLen = 64): string {
    let str = '';
    for (let i = 0; i < maxLen; i++) {
      if (offset + i >= view.byteLength) break;
      const charCode = view.getUint8(offset + i);
      if (charCode === 0) break;
      str += String.fromCharCode(charCode);
    }
    return str.trim();
  }

  private parsePngDpi(buffer: ArrayBuffer): number | null {
    const view = new DataView(buffer);
    if (view.getUint32(0) !== 0x89504E47) return null;

    let offset = 8;
    while (offset < view.byteLength - 8) {
      const length = view.getUint32(offset);
      const chunkType = view.getUint32(offset + 4);

      if (chunkType === 0x70485973) {
        const ppuX = view.getUint32(offset + 8);
        const unit = view.getUint8(offset + 16);
        if (unit === 1) {
          const dpi = Math.round(ppuX * 0.0254);
          return dpi;
        }
      }
      offset += 12 + length;
    }
    return null;
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB (${(bytes / 1024).toLocaleString(undefined, { maximumFractionDigits: 1 })} KB)`;
  }

  private renderResults(): void {
    if (!this.currentResult) return;
    const r = this.currentResult;

    if (this.uploadView) this.uploadView.hidden = true;
    if (this.editorView) this.editorView.hidden = false;

    if (this.previewImg) {
      this.previewImg.src = r.dataUrl;
      this.previewImg.alt = r.fileName;
    }

    this.setText('#dim-val-resolution', `${r.width.toLocaleString()} × ${r.height.toLocaleString()} px`);
    this.setText('#dim-val-megapixels', `${r.megapixels} MP (${r.totalPixels.toLocaleString()} px)`);
    this.setText('#dim-val-aspect', `${r.aspectRatio} (${r.decimalRatio}:1 • ${r.orientation})`);
    this.setText('#dim-val-size', this.formatFileSize(r.fileSize));

    this.setText('#dim-badge-dimensions', `${r.width} × ${r.height} px`);
    this.setText('#dim-badge-aspect', r.aspectRatio);
    this.setText('#dim-badge-format', r.mimeType.replace('image/', '').toUpperCase());

    this.setText('#dim-table-filename', r.fileName);
    this.setText('#dim-table-mime', r.mimeType);
    this.setText('#dim-table-bpp', `${r.bitsPerPixel} bits / pixel`);
    this.setText('#dim-table-alpha', r.hasAlpha ? 'Yes (Alpha / Transparent)' : 'No (Opaque background)');
    this.setText('#dim-table-colordepth', r.hasAlpha ? '32-bit RGBA' : '24-bit RGB');
    this.setText('#dim-table-stdmatch', r.standardMatch || 'Custom Dimension');

    const exifGroup = this.root.querySelector('#dim-exif-card') as HTMLElement;
    const hasExifData = Object.keys(r.exif).length > 0;
    if (exifGroup) {
      if (hasExifData) {
        exifGroup.style.display = 'block';
        this.setText('#dim-exif-camera', [r.exif.make, r.exif.model].filter(Boolean).join(' ') || '—');
        this.setText('#dim-exif-date', r.exif.dateTime || '—');
        this.setText('#dim-exif-exposure', r.exif.exposureTime || '—');
        this.setText('#dim-exif-aperture', r.exif.fNumber || '—');
        this.setText('#dim-exif-iso', r.exif.iso ? `ISO ${r.exif.iso}` : '—');
        this.setText('#dim-exif-focal', r.exif.focalLength || '—');
        this.setText('#dim-exif-lens', r.exif.lensModel || '—');
        this.setText('#dim-exif-software', r.exif.software || '—');
        this.setText('#dim-exif-gps', r.exif.hasGps ? '⚠️ GPS Coordinates Present' : 'Clean (No GPS tag)');
      } else {
        exifGroup.style.display = 'none';
      }
    }

    const paletteContainer = this.root.querySelector('#dim-palette-list') as HTMLElement;
    if (paletteContainer) {
      paletteContainer.innerHTML = '';
      r.palette.forEach((hex) => {
        const item = document.createElement('div');
        item.className = 'color-swatch-box';
        item.dataset.hex = hex;
        item.innerHTML = `
          <div class="swatch-circle" style="background-color: ${hex};"></div>
          <span class="swatch-hex">${hex.toUpperCase()}</span>
          <span class="color-copied-tooltip">Copied!</span>
        `;
        paletteContainer.appendChild(item);
      });
    }

    this.updatePlatformCompatibility(r.width, r.height, r.aspectRatio);
    this.updatePrintCalculations();
  }

  private updatePlatformCompatibility(w: number, h: number, aspect: string): void {
    const setStatus = (id: string, ok: boolean, label: string) => {
      const el = this.root.querySelector(id) as HTMLElement;
      if (!el) return;
      el.className = `platform-status-pill ${ok ? 'status-ok' : 'status-warn'}`;
      el.textContent = `${label}: ${ok ? '✓ Ideal Match' : 'Resize Recommended'}`;
    };

    setStatus('#plat-ig-square', aspect === '1:1' && w >= 600, 'Instagram Square');
    setStatus('#plat-ig-story', aspect === '9:16' && w >= 720, 'Instagram Story / Reel');
    setStatus('#plat-yt-banner', w === 2560 && h === 1440, 'YouTube Banner');
    setStatus('#plat-yt-thumb', aspect === '16:9' && w >= 1280, 'YouTube Thumbnail');
    setStatus('#plat-fb-share', w >= 1200 && h >= 630 && Math.abs(w / h - 1.91) < 0.1, 'Facebook / OG Share');
    setStatus('#plat-x-header', w === 1500 && h === 500, 'X (Twitter) Header');
  }

  private updatePrintCalculations(): void {
    if (!this.currentResult) return;
    const dpi = this.currentDpi || 300;
    const wInches = this.currentResult.width / dpi;
    const hInches = this.currentResult.height / dpi;

    const wCm = wInches * 2.54;
    const hCm = hInches * 2.54;

    const wMm = wCm * 10;
    const hMm = hCm * 10;

    if (this.printInches) this.printInches.textContent = `${wInches.toFixed(2)}″ × ${hInches.toFixed(2)}″ inches`;
    if (this.printCm) this.printCm.textContent = `${wCm.toFixed(2)} × ${hCm.toFixed(2)} cm`;
    if (this.printMm) this.printMm.textContent = `${Math.round(wMm)} × ${Math.round(hMm)} mm`;
  }

  private setText(selector: string, text: string): void {
    const el = this.root.querySelector(selector);
    if (el) el.textContent = text;
  }

  private copyDimensions(): void {
    if (!this.currentResult) return;
    const text = `${this.currentResult.width} × ${this.currentResult.height} px`;
    navigator.clipboard.writeText(text);
    if (this.btnCopyDimensions) {
      const original = this.btnCopyDimensions.innerHTML;
      this.btnCopyDimensions.textContent = '✓ Copied!';
      setTimeout(() => (this.btnCopyDimensions!.innerHTML = original), 1500);
    }
  }

  private copyAllSpecs(): void {
    if (!this.currentResult) return;
    const r = this.currentResult;
    const dpi = this.currentDpi || 300;
    const wIn = (r.width / dpi).toFixed(2);
    const hIn = (r.height / dpi).toFixed(2);
    const wCm = (r.width / dpi * 2.54).toFixed(2);
    const hCm = (r.height / dpi * 2.54).toFixed(2);

    const report = [
      `=== ImgFeel Image Dimensions & Specs Report ===`,
      `File Name: ${r.fileName}`,
      `Dimensions: ${r.width} × ${r.height} px`,
      `Megapixels: ${r.megapixels} MP (${r.totalPixels.toLocaleString()} total pixels)`,
      `Aspect Ratio: ${r.aspectRatio} (${r.decimalRatio}:1 • ${r.orientation})`,
      `Standard Format: ${r.standardMatch || 'Custom'}`,
      `File Size: ${this.formatFileSize(r.fileSize)}`,
      `MIME Type: ${r.mimeType}`,
      `Color Depth: ${r.hasAlpha ? '32-bit RGBA' : '24-bit RGB'}`,
      `Dominant Color: ${r.dominantColor.toUpperCase()}`,
      `Print Size (@ ${dpi} DPI): ${wIn}″ × ${hIn}″ (${wCm} × ${hCm} cm)`,
      r.exif.make ? `Camera: ${r.exif.make} ${r.exif.model || ''}` : '',
      r.exif.exposureTime ? `Shutter: ${r.exif.exposureTime} | Aperture: ${r.exif.fNumber || ''} | ISO: ${r.exif.iso || ''}` : '',
      `=============================================`,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(report);
    if (this.btnCopySpecs) {
      const original = this.btnCopySpecs.innerHTML;
      this.btnCopySpecs.textContent = '✓ Report Copied to Clipboard!';
      setTimeout(() => (this.btnCopySpecs!.innerHTML = original), 2000);
    }
  }
}

// Auto-initialize when mounted
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('dimensions-checker-app');
  if (container) {
    new DimensionsChecker(container);
  }
});
