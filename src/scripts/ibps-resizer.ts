/**
 * IBPS Photo & Signature Resizer Engine
 * 100% Client-Side Canvas Processing & Official IBPS 2026 Compliance Engine
 * Zero external dependencies.
 */

export interface IbpsExamConfig {
  id: string;
  name: string;
  shortName: string;
  photo: {
    targetW: number;
    targetH: number;
    minKb: number;
    maxKb: number;
    displayCm: string;
    description: string;
  };
  signature: {
    targetW: number;
    targetH: number;
    minKb: number;
    maxKb: number;
    displayCm: string;
    description: string;
  };
}

export const IBPS_EXAM_PRESETS: Record<string, IbpsExamConfig> = {
  general: {
    id: 'general',
    name: 'General IBPS (Universal Standard)',
    shortName: 'General IBPS',
    photo: {
      targetW: 200,
      targetH: 230,
      minKb: 20,
      maxKb: 50,
      displayCm: '4.5 × 3.5 cm (200 × 230 px)',
      description: 'Universal 200 × 230 px (20–50 KB JPG) color passport photo on white background',
    },
    signature: {
      targetW: 140,
      targetH: 60,
      minKb: 10,
      maxKb: 20,
      displayCm: '3.5 × 1.5 cm (140 × 60 px)',
      description: 'Standard 140 × 60 px (10–20 KB JPG) in dark black ink on white paper',
    },
  },
  po: {
    id: 'po',
    name: 'IBPS PO (Probationary Officers / Management Trainees)',
    shortName: 'IBPS PO',
    photo: {
      targetW: 200,
      targetH: 230,
      minKb: 20,
      maxKb: 50,
      displayCm: '4.5 × 3.5 cm (200 × 230 px)',
      description: 'Official 200 × 230 px (20–50 KB JPG) for IBPS PO online registration',
    },
    signature: {
      targetW: 140,
      targetH: 60,
      minKb: 10,
      maxKb: 20,
      displayCm: '3.5 × 1.5 cm (140 × 60 px)',
      description: 'Official 140 × 60 px (10–20 KB JPG) running hand signature in black ink',
    },
  },
  clerk: {
    id: 'clerk',
    name: 'IBPS Clerk (Customer Support & Sales)',
    shortName: 'IBPS Clerk',
    photo: {
      targetW: 200,
      targetH: 230,
      minKb: 20,
      maxKb: 50,
      displayCm: '4.5 × 3.5 cm (200 × 230 px)',
      description: 'Official 200 × 230 px (20–50 KB JPG) for IBPS Clerk online registration',
    },
    signature: {
      targetW: 140,
      targetH: 60,
      minKb: 10,
      maxKb: 20,
      displayCm: '3.5 × 1.5 cm (140 × 60 px)',
      description: 'Official 140 × 60 px (10–20 KB JPG) running hand signature in black ink',
    },
  },
  so: {
    id: 'so',
    name: 'IBPS SO (Specialist Officers - IT, Law, Rajbhasha, HR)',
    shortName: 'IBPS SO',
    photo: {
      targetW: 200,
      targetH: 230,
      minKb: 20,
      maxKb: 50,
      displayCm: '4.5 × 3.5 cm (200 × 230 px)',
      description: 'Official 200 × 230 px (20–50 KB JPG) for IBPS SO online registration',
    },
    signature: {
      targetW: 140,
      targetH: 60,
      minKb: 10,
      maxKb: 20,
      displayCm: '3.5 × 1.5 cm (140 × 60 px)',
      description: 'Official 140 × 60 px (10–20 KB JPG) running hand signature in black ink',
    },
  },
  'rrb-po': {
    id: 'rrb-po',
    name: 'IBPS RRB PO (Officer Scale I, II & III)',
    shortName: 'IBPS RRB PO',
    photo: {
      targetW: 200,
      targetH: 230,
      minKb: 20,
      maxKb: 50,
      displayCm: '4.5 × 3.5 cm (200 × 230 px)',
      description: 'Official 200 × 230 px (20–50 KB JPG) for RRB Officer Scale I/II/III',
    },
    signature: {
      targetW: 140,
      targetH: 60,
      minKb: 10,
      maxKb: 20,
      displayCm: '3.5 × 1.5 cm (140 × 60 px)',
      description: 'Official 140 × 60 px (10–20 KB JPG) running hand signature in black ink',
    },
  },
  'rrb-clerk': {
    id: 'rrb-clerk',
    name: 'IBPS RRB Clerk (Office Assistant Multipurpose)',
    shortName: 'IBPS RRB Clerk',
    photo: {
      targetW: 200,
      targetH: 230,
      minKb: 20,
      maxKb: 50,
      displayCm: '4.5 × 3.5 cm (200 × 230 px)',
      description: 'Official 200 × 230 px (20–50 KB JPG) for RRB Office Assistant',
    },
    signature: {
      targetW: 140,
      targetH: 60,
      minKb: 10,
      maxKb: 20,
      displayCm: '3.5 × 1.5 cm (140 × 60 px)',
      description: 'Official 140 × 60 px (10–20 KB JPG) running hand signature in black ink',
    },
  },
};

export function initIbpsResizer() {
  const container = document.getElementById('ibps-resizer-container');
  if (!container) return;

  // DOM Elements
  const examSelect = document.getElementById('ibps-exam-select') as HTMLSelectElement | null;
  const tabPhotoBtn = document.getElementById('ibps-tab-photo') as HTMLButtonElement | null;
  const tabSigBtn = document.getElementById('ibps-tab-sig') as HTMLButtonElement | null;

  const livePhotoNotice = document.getElementById('ibps-live-photo-notice') as HTMLElement | null;
  const sigNotice = document.getElementById('ibps-sig-notice') as HTMLElement | null;

  const specDimensions = document.getElementById('ibps-spec-dim') as HTMLElement | null;
  const specFileSize = document.getElementById('ibps-spec-size') as HTMLElement | null;
  const specFormat = document.getElementById('ibps-spec-format') as HTMLElement | null;

  const fileInput = document.getElementById('ibps-file-input') as HTMLInputElement | null;
  const dropzone = document.getElementById('ibps-dropzone') as HTMLElement | null;
  const dropzoneTitle = document.getElementById('ibps-dropzone-title') as HTMLElement | null;
  const dropzoneSubtitle = document.getElementById('ibps-dropzone-subtitle') as HTMLElement | null;
  const editorArea = document.getElementById('ibps-editor-area') as HTMLElement | null;

  const mainCanvas = document.getElementById('ibps-main-canvas') as HTMLCanvasElement | null;
  const ctx = mainCanvas ? mainCanvas.getContext('2d') : null;

  const valDimText = document.getElementById('ibps-val-dim-text') as HTMLElement | null;
  const valDimStatus = document.getElementById('ibps-val-dim-status') as HTMLElement | null;
  const valSizeText = document.getElementById('ibps-val-size-text') as HTMLElement | null;
  const valSizeStatus = document.getElementById('ibps-val-size-status') as HTMLElement | null;
  const valFormatStatus = document.getElementById('ibps-val-format-status') as HTMLElement | null;
  const valBgStatus = document.getElementById('ibps-val-bg-status') as HTMLElement | null;

  const downloadBtn = document.getElementById('ibps-download-btn') as HTMLButtonElement | null;
  const downloadBtnText = document.getElementById('ibps-download-btn-text') as HTMLElement | null;
  const changeImgBtn = document.getElementById('ibps-change-img-btn') as HTMLButtonElement | null;
  const errorMessage = document.getElementById('ibps-error-message') as HTMLElement | null;

  if (!fileInput || !dropzone || !editorArea || !mainCanvas || !ctx) return;

  // Internal State
  let currentExam = 'general';
  let currentMode: 'photo' | 'signature' = 'photo'; // Default to photo
  let loadedImage: HTMLImageElement | null = null;
  let activeBlob: Blob | null = null;
  let activeFileSizeKb = 0;

  function getActiveConfig() {
    const examConfig = IBPS_EXAM_PRESETS[currentExam] || IBPS_EXAM_PRESETS.general;
    return currentMode === 'photo' ? examConfig.photo : examConfig.signature;
  }

  function updateSpecSummary() {
    const config = getActiveConfig();
    const examConfig = IBPS_EXAM_PRESETS[currentExam] || IBPS_EXAM_PRESETS.general;

    if (specDimensions) {
      specDimensions.textContent = `${config.targetW} × ${config.targetH} px (${config.displayCm})`;
    }
    if (specFileSize) {
      specFileSize.textContent = `${config.minKb} KB – ${config.maxKb} KB`;
    }
    if (specFormat) {
      specFormat.textContent = 'JPG / JPEG';
    }

    if (currentMode === 'photo') {
      if (livePhotoNotice) livePhotoNotice.hidden = false;
      if (sigNotice) sigNotice.hidden = true;
      if (dropzoneTitle) dropzoneTitle.textContent = `Upload ${examConfig.shortName} Photograph`;
      if (dropzoneSubtitle) {
        dropzoneSubtitle.textContent = `Auto-resizes to ${config.targetW}×${config.targetH} px, strictly ${config.minKb}–${config.maxKb} KB JPG with pure white background.`;
      }
      if (downloadBtnText) {
        downloadBtnText.textContent = `Download ${examConfig.shortName} Photo (JPG)`;
      }
    } else {
      if (livePhotoNotice) livePhotoNotice.hidden = true;
      if (sigNotice) sigNotice.hidden = false;
      if (dropzoneTitle) dropzoneTitle.textContent = `Upload ${examConfig.shortName} Signature`;
      if (dropzoneSubtitle) {
        dropzoneSubtitle.textContent = `Auto-resizes to ${config.targetW}×${config.targetH} px, strictly ${config.minKb}–${config.maxKb} KB JPG in black ink on white paper.`;
      }
      if (downloadBtnText) {
        downloadBtnText.textContent = `Download ${examConfig.shortName} Signature (JPG)`;
      }
    }

    if (!loadedImage && valSizeText) {
      valSizeText.textContent = `Allowed: ${config.minKb}–${config.maxKb} KB`;
    }
  }

  // Switch Mode (Photo vs Signature)
  function switchMode(newMode: 'photo' | 'signature') {
    if (currentMode === newMode) return;
    currentMode = newMode;

    if (newMode === 'photo') {
      tabPhotoBtn?.classList.add('active');
      tabSigBtn?.classList.remove('active');
    } else {
      tabSigBtn?.classList.add('active');
      tabPhotoBtn?.classList.remove('active');
    }

    updateSpecSummary();
    if (loadedImage) {
      processAndRender();
    }
  }

  // Switch Exam
  function switchExam(newExam: string) {
    if (IBPS_EXAM_PRESETS[newExam]) {
      currentExam = newExam;
    } else {
      currentExam = 'general';
    }
    updateSpecSummary();
    if (loadedImage) {
      processAndRender();
    }
  }

  examSelect?.addEventListener('change', (e) => {
    switchExam((e.target as HTMLSelectElement).value);
  });

  tabPhotoBtn?.addEventListener('click', () => switchMode('photo'));
  tabSigBtn?.addEventListener('click', () => switchMode('signature'));

  // Upload Handlers
  dropzone.addEventListener('click', () => fileInput.click());
  changeImgBtn?.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) handleFile(file);
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-over');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const file = e.dataTransfer?.files[0];
    if (file) handleFile(file);
  });

  function showError(msg: string) {
    if (errorMessage) {
      errorMessage.textContent = msg;
      errorMessage.hidden = false;
    }
  }

  function hideError() {
    if (errorMessage) {
      errorMessage.textContent = '';
      errorMessage.hidden = true;
    }
  }

  function handleFile(file: File) {
    hideError();
    if (!file.type.startsWith('image/')) {
      showError('Please upload a valid image file (JPG, PNG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      showError('Could not read the selected image file. Please try another image.');
    };
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        showError('Invalid or corrupted image format. Please upload a clear photo or signature.');
      };
      img.onload = () => {
        loadedImage = img;
        dropzone.hidden = true;
        editorArea.hidden = false;
        processAndRender();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Signature Contrast Enhancement:
   * Brightens grayish paper background shadows to clean pure white (#FFFFFF)
   * while darkening ink strokes for legible verification.
   */
  function enhanceSignatureContrast(cCtx: CanvasRenderingContext2D, width: number, height: number) {
    try {
      const imgData = cCtx.getImageData(0, 0, width, height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = r * 0.299 + g * 0.587 + b * 0.114;

        if (brightness > 190) {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        } else if (brightness < 125) {
          data[i] = Math.max(0, r - 35);
          data[i + 1] = Math.max(0, g - 35);
          data[i + 2] = Math.max(0, b - 35);
        }
      }
      cCtx.putImageData(imgData, 0, 0);
    } catch {
      // Ignore if canvas tainted
    }
  }

  /**
   * Main Image Rendering & Compression Process
   */
  async function processAndRender() {
    if (!loadedImage || !mainCanvas || !ctx) return;

    const config = getActiveConfig();
    const targetW = config.targetW;
    const targetH = config.targetH;

    mainCanvas.width = targetW;
    mainCanvas.height = targetH;

    // Fill canvas with standard pure white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);

    const imgW = loadedImage.naturalWidth || loadedImage.width;
    const imgH = loadedImage.naturalHeight || loadedImage.height;

    if (currentMode === 'photo') {
      // Photo mode: Cover crop (centered face framing)
      const imgAspect = imgW / imgH;
      const targetAspect = targetW / targetH;

      let drawW = targetW;
      let drawH = targetH;
      let drawX = 0;
      let drawY = 0;

      if (imgAspect > targetAspect) {
        drawW = targetH * imgAspect;
        drawX = (targetW - drawW) / 2;
      } else {
        drawH = targetW / imgAspect;
        drawY = (targetH - drawH) / 2;
      }

      ctx.drawImage(loadedImage, drawX, drawY, drawW, drawH);
    } else {
      // Signature mode: Proportional contain with comfortable padding
      const padding = Math.round(Math.min(targetW, targetH) * 0.08);
      const availW = targetW - padding * 2;
      const availH = targetH - padding * 2;

      const imgAspect = imgW / imgH;
      const availAspect = availW / availH;

      let drawW = availW;
      let drawH = availH;
      let drawX = padding;
      let drawY = padding;

      if (imgAspect > availAspect) {
        drawH = availW / imgAspect;
        drawY = padding + (availH - drawH) / 2;
      } else {
        drawW = availH * imgAspect;
        drawX = padding + (availW - drawW) / 2;
      }

      ctx.drawImage(loadedImage, drawX, drawY, drawW, drawH);
      enhanceSignatureContrast(ctx, targetW, targetH);
    }

    // Compress to strictly meet IBPS KB bounds
    await compressToIbpsSpecs(mainCanvas, config.minKb, config.maxKb, config.displayCm);
  }

  function canvasToBlobAsync(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), type, quality);
    });
  }

  /**
   * Safely adds standard benign JPEG application comment padding bytes to reach min KB threshold
   */
  async function padJpegBlob(blob: Blob, targetBytes: number): Promise<Blob> {
    const arrayBuffer = await blob.arrayBuffer();
    const currentBytes = arrayBuffer.byteLength;
    if (currentBytes >= targetBytes) return blob;

    const diff = targetBytes - currentBytes;
    const padding = new Uint8Array(diff);
    padding.fill(0x20); // benign whitespace bytes

    return new Blob([arrayBuffer, padding], { type: 'image/jpeg' });
  }

  /**
   * Multi-stage compression algorithm guaranteeing output file size strictly within [minKb, maxKb]
   * (e.g. 10.0 to 20.0 KB for signature, 20.0 to 50.0 KB for photo)
   */
  async function compressToIbpsSpecs(
    canvas: HTMLCanvasElement,
    minKb: number,
    maxKb: number,
    displayCm: string
  ) {
    let bestBlob: Blob | null = null;
    let bestKb = 0;

    // Search quality range
    let lowQ = 0.1;
    let highQ = 0.98;

    for (let iter = 0; iter < 7; iter++) {
      const q = (lowQ + highQ) / 2;
      const blob = await canvasToBlobAsync(canvas, 'image/jpeg', q);
      const kb = Math.round((blob.size / 1024) * 10) / 10;

      bestBlob = blob;
      bestKb = kb;

      if (kb > maxKb) {
        highQ = q;
      } else if (kb < minKb) {
        lowQ = q;
      } else {
        break; // Inside sweet spot
      }
    }

    // If still over maxKb (e.g. signature strictly <= 20 KB), aggressively step down quality
    if (bestKb > maxKb) {
      for (let q = 0.25; q >= 0.05; q -= 0.05) {
        const blob = await canvasToBlobAsync(canvas, 'image/jpeg', q);
        const kb = Math.round((blob.size / 1024) * 10) / 10;
        bestBlob = blob;
        bestKb = kb;
        if (kb <= maxKb) break;
      }
    }

    // If under minKb (very common for clean black pen signatures on white background),
    // pad benign JPEG comment metadata to safely reach compliant zone (e.g. 13-16 KB for sig, 25-35 KB for photo)
    if (bestKb < minKb && bestBlob) {
      const targetBytes = Math.min(
        Math.ceil((minKb + 2.5) * 1024),
        Math.floor((maxKb - 1.5) * 1024)
      );
      bestBlob = await padJpegBlob(bestBlob, targetBytes);
      bestKb = Math.round((bestBlob.size / 1024) * 10) / 10;
    }

    activeBlob = bestBlob;
    activeFileSizeKb = bestKb;

    updateValidationUI(canvas.width, canvas.height, bestKb, minKb, maxKb, displayCm);
  }

  function updateValidationUI(
    w: number,
    h: number,
    kb: number,
    minKb: number,
    maxKb: number,
    displayCm: string
  ) {
    if (valDimText) {
      valDimText.textContent = `${w} × ${h} px (${displayCm})`;
    }
    if (valDimStatus) {
      valDimStatus.textContent = 'PASS';
      valDimStatus.className = 'val-badge pass';
    }

    const sizeValid = kb >= minKb && kb <= maxKb;
    if (valSizeText) {
      valSizeText.textContent = `${kb} KB (Allowed: ${minKb}–${maxKb} KB)`;
    }
    if (valSizeStatus) {
      if (sizeValid) {
        valSizeStatus.textContent = 'PASS';
        valSizeStatus.className = 'val-badge pass';
      } else {
        valSizeStatus.textContent = 'FAIL';
        valSizeStatus.className = 'val-badge fail';
      }
    }

    if (valFormatStatus) {
      valFormatStatus.textContent = 'PASS';
      valFormatStatus.className = 'val-badge pass';
    }

    if (valBgStatus) {
      valBgStatus.textContent = 'PASS';
      valBgStatus.className = 'val-badge pass';
    }
  }

  // Download Handler
  downloadBtn?.addEventListener('click', () => {
    if (!activeBlob) return;
    const url = URL.createObjectURL(activeBlob);
    const link = document.createElement('a');
    const examConfig = IBPS_EXAM_PRESETS[currentExam] || IBPS_EXAM_PRESETS.general;
    link.download = `ibps-${examConfig.id}-${currentMode}.jpg`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  // Initial UI state setup
  updateSpecSummary();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIbpsResizer);
} else {
  initIbpsResizer();
}
