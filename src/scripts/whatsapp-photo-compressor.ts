/**
 * WhatsApp Photo Compressor - Client-Side Image Compression Engine
 * 100% lightweight, canvas-based multi-pass binary search compressor.
 */

interface CompressionOptions {
  targetBytes: number;
  format: 'image/jpeg' | 'image/webp' | 'image/png';
  maxEdge?: number;
}

interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  size: number;
  format: string;
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

class WhatsAppCompressorApp {
  private appEl: HTMLElement;
  private dropzoneEl: HTMLElement;
  private fileInputEl: HTMLInputElement;
  private btnBrowseEl: HTMLButtonElement;
  private editorAreaEl: HTMLElement;
  private resultAreaEl: HTMLElement;
  private errorAreaEl: HTMLElement;
  private errorMessageEl: HTMLElement;

  // Preview elements
  private previewThumbEl: HTMLImageElement;
  private origFilenameEl: HTMLElement;
  private origDimEl: HTMLElement;
  private origSizeEl: HTMLElement;

  // Preset & custom inputs
  private presetButtons: NodeListOf<HTMLButtonElement>;
  private customGroupEl: HTMLElement;
  private customValueInput: HTMLInputElement;
  private customUnitSelect: HTMLSelectElement;
  private formatSelect: HTMLSelectElement;
  private btnCompress: HTMLButtonElement;

  // Result elements
  private resultPreviewImg: HTMLImageElement;
  private resOrigSizeEl: HTMLElement;
  private resCompSizeEl: HTMLElement;
  private resSavedBadgeEl: HTMLElement;
  private resDimEl: HTMLElement;
  private resFormatEl: HTMLElement;
  private btnDownload: HTMLButtonElement;
  private btnReset: HTMLButtonElement;

  // State
  private currentFile: File | null = null;
  private originalImage: HTMLImageElement | null = null;
  private originalDimensions = { width: 0, height: 0 };
  private activeTargetBytes = 100 * 1024; // Default 100 KB
  private activePreset = '100kb';
  private compressedResult: CompressionResult | null = null;

  constructor(appEl: HTMLElement) {
    this.appEl = appEl;
    this.dropzoneEl = appEl.querySelector('#wa-dropzone') as HTMLElement;
    this.fileInputEl = appEl.querySelector('#wa-file-input') as HTMLInputElement;
    this.btnBrowseEl = appEl.querySelector('#wa-btn-browse') as HTMLButtonElement;
    this.editorAreaEl = appEl.querySelector('#wa-editor-area') as HTMLElement;
    this.resultAreaEl = appEl.querySelector('#wa-result-area') as HTMLElement;
    this.errorAreaEl = appEl.querySelector('#wa-error-area') as HTMLElement;
    this.errorMessageEl = appEl.querySelector('#wa-error-message') as HTMLElement;

    this.previewThumbEl = appEl.querySelector('#wa-preview-thumb') as HTMLImageElement;
    this.origFilenameEl = appEl.querySelector('#wa-orig-filename') as HTMLElement;
    this.origDimEl = appEl.querySelector('#wa-orig-dim') as HTMLElement;
    this.origSizeEl = appEl.querySelector('#wa-orig-size') as HTMLElement;

    this.presetButtons = appEl.querySelectorAll('.wa-preset-pill');
    this.customGroupEl = appEl.querySelector('#wa-custom-group') as HTMLElement;
    this.customValueInput = appEl.querySelector('#wa-custom-value') as HTMLInputElement;
    this.customUnitSelect = appEl.querySelector('#wa-custom-unit') as HTMLSelectElement;
    this.formatSelect = appEl.querySelector('#wa-format-select') as HTMLSelectElement;
    this.btnCompress = appEl.querySelector('#wa-btn-compress') as HTMLButtonElement;

    this.resultPreviewImg = appEl.querySelector('#wa-result-preview-img') as HTMLImageElement;
    this.resOrigSizeEl = appEl.querySelector('#wa-res-orig-size') as HTMLElement;
    this.resCompSizeEl = appEl.querySelector('#wa-res-comp-size') as HTMLElement;
    this.resSavedBadgeEl = appEl.querySelector('#wa-res-saved-badge') as HTMLElement;
    this.resDimEl = appEl.querySelector('#wa-res-dim') as HTMLElement;
    this.resFormatEl = appEl.querySelector('#wa-res-format') as HTMLElement;
    this.btnDownload = appEl.querySelector('#wa-btn-download') as HTMLButtonElement;
    this.btnReset = appEl.querySelector('#wa-btn-reset') as HTMLButtonElement;

    this.initEvents();
  }

  private initEvents(): void {
    // Dropzone events
    if (this.dropzoneEl) {
      this.dropzoneEl.addEventListener('click', () => this.fileInputEl.click());
      this.dropzoneEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.dropzoneEl.classList.add('drag-over');
      });
      this.dropzoneEl.addEventListener('dragleave', () => {
        this.dropzoneEl.classList.remove('drag-over');
      });
      this.dropzoneEl.addEventListener('drop', (e) => {
        e.preventDefault();
        this.dropzoneEl.classList.remove('drag-over');
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
          this.handleFile(e.dataTransfer.files[0]);
        }
      });
    }

    if (this.btnBrowseEl) {
      this.btnBrowseEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.fileInputEl.click();
      });
    }

    if (this.fileInputEl) {
      this.fileInputEl.addEventListener('change', () => {
        if (this.fileInputEl.files && this.fileInputEl.files.length > 0) {
          this.handleFile(this.fileInputEl.files[0]);
        }
      });
    }

    // Presets
    this.presetButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-preset');
        if (!preset) return;
        this.setPreset(preset);
      });
    });

    // Custom inputs change
    if (this.customValueInput) {
      this.customValueInput.addEventListener('input', () => this.updateCustomTarget());
    }
    if (this.customUnitSelect) {
      this.customUnitSelect.addEventListener('change', () => this.updateCustomTarget());
    }

    // Compress Action
    if (this.btnCompress) {
      this.btnCompress.addEventListener('click', () => this.processCompression());
    }

    // Download Action
    if (this.btnDownload) {
      this.btnDownload.addEventListener('click', () => this.downloadImage());
    }

    // Reset Action
    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => this.resetState());
    }
  }

  private setPreset(preset: string): void {
    this.activePreset = preset;
    this.presetButtons.forEach((b) => {
      if (b.getAttribute('data-preset') === preset) {
        b.classList.add('active');
        b.setAttribute('aria-pressed', 'true');
      } else {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      }
    });

    if (preset === 'custom') {
      if (this.customGroupEl) this.customGroupEl.hidden = false;
      this.updateCustomTarget();
    } else {
      if (this.customGroupEl) this.customGroupEl.hidden = true;
      const sizeMap: Record<string, number> = {
        '20kb': 20 * 1024,
        '50kb': 50 * 1024,
        '100kb': 100 * 1024,
        '200kb': 200 * 1024,
        '500kb': 500 * 1024,
        '1mb': 1024 * 1024,
      };
      this.activeTargetBytes = sizeMap[preset] || 100 * 1024;
    }
  }

  private updateCustomTarget(): void {
    const val = parseFloat(this.customValueInput.value) || 100;
    const unit = this.customUnitSelect.value || 'KB';
    if (unit === 'MB') {
      this.activeTargetBytes = Math.max(10 * 1024, Math.round(val * 1024 * 1024));
    } else {
      this.activeTargetBytes = Math.max(5 * 1024, Math.round(val * 1024));
    }
  }

  private showError(msg: string): void {
    if (this.errorAreaEl && this.errorMessageEl) {
      this.errorMessageEl.textContent = msg;
      this.errorAreaEl.hidden = false;
    }
  }

  private clearError(): void {
    if (this.errorAreaEl) {
      this.errorAreaEl.hidden = true;
    }
  }

  private async handleFile(file: File): Promise<void> {
    this.clearError();
    if (!file.type.startsWith('image/')) {
      this.showError(this.appEl.dataset.i18nInvalid || 'Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    this.currentFile = file;

    try {
      const img = await this.loadImage(file);
      this.originalImage = img;
      this.originalDimensions = { width: img.naturalWidth, height: img.naturalHeight };

      // Update UI metadata
      if (this.previewThumbEl) this.previewThumbEl.src = img.src;
      if (this.origFilenameEl) this.origFilenameEl.textContent = file.name;
      if (this.origDimEl) this.origDimEl.textContent = `${img.naturalWidth} × ${img.naturalHeight} px`;
      if (this.origSizeEl) this.origSizeEl.textContent = formatBytes(file.size);

      // Show editor area, hide dropzone
      if (this.dropzoneEl) this.dropzoneEl.hidden = true;
      if (this.editorAreaEl) this.editorAreaEl.hidden = false;
      if (this.resultAreaEl) this.resultAreaEl.hidden = true;

      // Auto-run initial compression for immediate instant feedback
      await this.processCompression();
    } catch (err) {
      this.showError(this.appEl.dataset.i18nLoadFailed || 'Failed to load image. Please try another file.');
    }
  }

  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image decode error'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  }

  private async processCompression(): Promise<void> {
    if (!this.originalImage || !this.currentFile) return;

    this.clearError();
    const btnText = this.btnCompress.querySelector('span');
    const originalText = btnText ? btnText.textContent : '';
    if (btnText) btnText.textContent = this.appEl.dataset.i18nProcessing || 'Compressing...';
    this.btnCompress.disabled = true;

    try {
      let chosenFormat: 'image/jpeg' | 'image/webp' | 'image/png' = 'image/jpeg';
      const selectedFmt = this.formatSelect?.value || 'auto';
      if (selectedFmt === 'webp') {
        chosenFormat = 'image/webp';
      } else if (selectedFmt === 'original') {
        if (this.currentFile.type === 'image/webp') chosenFormat = 'image/webp';
        else if (this.currentFile.type === 'image/png') chosenFormat = 'image/png';
        else chosenFormat = 'image/jpeg';
      }

      const result = await this.compressToTarget(this.originalImage, {
        targetBytes: this.activeTargetBytes,
        format: chosenFormat,
      });

      this.compressedResult = result;
      this.displayResult(result);
    } catch (err) {
      this.showError(this.appEl.dataset.i18nProcessFailed || 'Compression failed. Please try a different target size.');
    } finally {
      if (btnText && originalText) btnText.textContent = originalText;
      this.btnCompress.disabled = false;
    }
  }

  /**
   * Smart multi-pass binary search compression
   */
  private async compressToTarget(
    img: HTMLImageElement,
    opts: CompressionOptions
  ): Promise<CompressionResult> {
    const targetBytes = opts.targetBytes;
    const format = opts.format;
    let width = img.naturalWidth;
    let height = img.naturalHeight;

    // Constrain extreme dimensions for WhatsApp optimization if source is massive (>3840px)
    const MAX_EDGE = 2560;
    if (width > MAX_EDGE || height > MAX_EDGE) {
      if (width > height) {
        height = Math.round((height * MAX_EDGE) / width);
        width = MAX_EDGE;
      } else {
        width = Math.round((width * MAX_EDGE) / height);
        height = MAX_EDGE;
      }
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) throw new Error('Failed to create canvas context');

    // Helper to generate blob from canvas at given scale & quality
    const testCompress = (scale: number, quality: number): Promise<Blob> => {
      const curW = Math.max(16, Math.round(width * scale));
      const curH = Math.max(16, Math.round(height * scale));
      canvas.width = curW;
      canvas.height = curH;

      ctx.clearRect(0, 0, curW, curH);
      // WhatsApp images look best with a pure white background for transparent inputs
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, curW, curH);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, curW, curH);

      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          },
          format,
          quality
        );
      });
    };

    // PNG doesn't support variable lossy quality parameter in standard toBlob;
    // If user requested PNG and target is small, auto fallback to WebP/JPEG for accurate size
    if (format === 'image/png') {
      const testBlob = await testCompress(1.0, 1.0);
      if (testBlob.size <= targetBytes) {
        return {
          blob: testBlob,
          dataUrl: URL.createObjectURL(testBlob),
          width,
          height,
          size: testBlob.size,
          format: 'PNG',
        };
      }
    }

    let scale = 1.0;
    let bestBlob: Blob | null = null;
    let bestDiff = Infinity;
    let bestW = width;
    let bestH = height;

    // If target size is very small compared to original (e.g. 20KB or 50KB for a huge image),
    // we may need dimension scaling
    for (let scaleAttempt = 0; scaleAttempt < 4; scaleAttempt++) {
      let lowQ = 0.05;
      let highQ = 0.98;
      let currentBestAtScale: Blob | null = null;

      // 6 binary search iterations on quality
      for (let iter = 0; iter < 6; iter++) {
        const midQ = (lowQ + highQ) / 2;
        const blob = await testCompress(scale, midQ);
        const size = blob.size;

        const diff = Math.abs(size - targetBytes);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestBlob = blob;
          bestW = Math.round(width * scale);
          bestH = Math.round(height * scale);
        }

        if (size <= targetBytes) {
          currentBestAtScale = blob;
          lowQ = midQ; // try to get better quality while staying under target
        } else {
          highQ = midQ;
        }
      }

      // If we found a result <= targetBytes, or within 10% tolerance, accept it
      if (currentBestAtScale && currentBestAtScale.size <= targetBytes * 1.05) {
        bestBlob = currentBestAtScale;
        break;
      }

      // If at lowest quality (0.05) size is still larger than target, reduce canvas scale
      scale *= 0.75;
    }

    if (!bestBlob) {
      bestBlob = await testCompress(1.0, 0.8);
    }

    const fmtName = format === 'image/webp' ? 'WebP' : format === 'image/png' ? 'PNG' : 'JPG';
    return {
      blob: bestBlob,
      dataUrl: URL.createObjectURL(bestBlob),
      width: bestW,
      height: bestH,
      size: bestBlob.size,
      format: fmtName,
    };
  }

  private displayResult(result: CompressionResult): void {
    if (!this.currentFile) return;

    if (this.resultPreviewImg) {
      this.resultPreviewImg.src = result.dataUrl;
    }
    if (this.resOrigSizeEl) {
      this.resOrigSizeEl.textContent = formatBytes(this.currentFile.size);
    }
    if (this.resCompSizeEl) {
      this.resCompSizeEl.textContent = formatBytes(result.size);
    }
    if (this.resDimEl) {
      this.resDimEl.textContent = `${result.width} × ${result.height} px`;
    }
    if (this.resFormatEl) {
      this.resFormatEl.textContent = result.format;
    }

    if (this.resSavedBadgeEl) {
      const savedBytes = this.currentFile.size - result.size;
      const pct = Math.round((savedBytes / this.currentFile.size) * 100);
      if (pct > 0) {
        this.resSavedBadgeEl.textContent = `-${pct}% (${formatBytes(savedBytes)} saved)`;
        this.resSavedBadgeEl.className = 'saved-badge positive';
      } else {
        this.resSavedBadgeEl.textContent = 'Optimized for WhatsApp';
        this.resSavedBadgeEl.className = 'saved-badge neutral';
      }
    }

    if (this.resultAreaEl) {
      this.resultAreaEl.hidden = false;
      this.resultAreaEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  private downloadImage(): void {
    if (!this.compressedResult || !this.currentFile) return;
    const origName = this.currentFile.name.replace(/\.[^/.]+$/, '');
    const ext = this.compressedResult.format.toLowerCase() === 'webp' ? 'webp' : 'jpg';
    const downloadName = `${origName}-whatsapp-compressed.${ext}`;

    const a = document.createElement('a');
    a.href = this.compressedResult.dataUrl;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  private resetState(): void {
    this.currentFile = null;
    this.originalImage = null;
    this.compressedResult = null;

    if (this.fileInputEl) this.fileInputEl.value = '';
    if (this.previewThumbEl) this.previewThumbEl.src = '';
    if (this.resultPreviewImg) this.resultPreviewImg.src = '';

    this.clearError();
    if (this.editorAreaEl) this.editorAreaEl.hidden = true;
    if (this.resultAreaEl) this.resultAreaEl.hidden = true;
    if (this.dropzoneEl) this.dropzoneEl.hidden = false;
  }
}

// Auto-initialize when mounted
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('whatsapp-compressor-app');
  if (app) {
    new WhatsAppCompressorApp(app);
  }
});
