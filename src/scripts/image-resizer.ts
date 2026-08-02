/**
 * ImgFeel Image Resizer — Client-side image processing
 * Pure vanilla JS, Canvas API, zero dependencies
 */

interface ResizerState {
  file: File | null;
  originalImage: HTMLImageElement | null;
  originalWidth: number;
  originalHeight: number;
  aspectRatio: number;
  mode: 'dimensions' | 'percentage' | 'targetSize';
  resultBlob: Blob | null;
  resultUrl: string | null;
}

const app = document.getElementById('image-resizer-app');
if (!app) throw new Error('Resizer app container not found');

// Read i18n strings from data attributes
const i18n = {
  infoFilename: app.dataset.i18nInfoFilename ?? 'Filename',
  infoFormat: app.dataset.i18nInfoFormat ?? 'Format',
  infoOriginalSize: app.dataset.i18nInfoOriginalSize ?? 'Original Size',
  infoDimensions: app.dataset.i18nInfoDimensions ?? 'Dimensions',
  resultNewDimensions: app.dataset.i18nResultNewDimensions ?? 'New Dimensions',
  resultNewSize: app.dataset.i18nResultNewSize ?? 'Estimated Size',
  errorInvalid: app.dataset.i18nErrorInvalid ?? 'Invalid file',
  errorLoad: app.dataset.i18nErrorLoad ?? 'Failed to load',
  errorResize: app.dataset.i18nErrorResize ?? 'Failed to resize',
  statusProcessing: app.dataset.i18nStatusProcessing ?? 'Processing...',
  statusComplete: app.dataset.i18nStatusComplete ?? 'Done!',
};

// DOM Elements
const uploadSection = document.getElementById('resizer-upload')!;
const editorSection = document.getElementById('resizer-editor')!;
const errorSection = document.getElementById('resizer-error')!;
const dropzone = document.getElementById('resizer-dropzone')!;
const fileInput = document.getElementById('resizer-file-input') as HTMLInputElement;
const preview = document.getElementById('resizer-preview') as HTMLImageElement;
const infoArea = document.getElementById('resizer-info')!;
const resultSection = document.getElementById('resizer-result')!;
const resultInfo = document.getElementById('result-info')!;
const errorMessage = document.getElementById('error-message')!;

const modeDimBtn = document.getElementById('mode-dimensions')!;
const modePctBtn = document.getElementById('mode-percentage')!;
const modeTargetBtn = document.getElementById('mode-target-size')!;

const controlsDim = document.getElementById('controls-dimensions')!;
const controlsPct = document.getElementById('controls-percentage')!;
const controlsTarget = document.getElementById('controls-target-size')!;
const qualityGroup = document.getElementById('quality-group')!;

const widthInput = document.getElementById('resize-width') as HTMLInputElement;
const heightInput = document.getElementById('resize-height') as HTMLInputElement;
const percentageInput = document.getElementById('resize-percentage') as HTMLInputElement;
const targetSizeInput = document.getElementById('resize-target-size') as HTMLInputElement;

const lockAspect = document.getElementById('lock-aspect') as HTMLInputElement;
const qualityInput = document.getElementById('resize-quality') as HTMLInputElement;
const qualityValue = document.getElementById('quality-value')!;

const presetBtns = document.querySelectorAll<HTMLButtonElement>('.preset-btn');
const targetPresetBtns = document.querySelectorAll<HTMLButtonElement>('.target-preset-btn');
const pctPreviewInfo = document.getElementById('pct-preview-info');

const btnResize = document.getElementById('btn-resize')!;
const btnDownload = document.getElementById('btn-download')!;
const btnNewImage = document.getElementById('btn-new-image')!;

// State
const state: ResizerState = {
  file: null,
  originalImage: null,
  originalWidth: 0,
  originalHeight: 0,
  aspectRatio: 1,
  mode: 'dimensions',
  resultBlob: null,
  resultUrl: null,
};

// Utility: format file size
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// Utility: get mime type from file
function getMimeType(file: File): string {
  if (file.type === 'image/png') return 'image/png';
  if (file.type === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

// Utility: get extension from mime
function getExtension(mime: string): string {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '.jpg';
}

// Show error
function showError(msg: string): void {
  errorMessage.textContent = msg;
  errorSection.hidden = false;
  setTimeout(() => {
    errorSection.hidden = true;
  }, 5000);
}

// Validate file
function isValidImage(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

// Update percentage preview calculation & preset button highlights
function updatePercentagePreview(): void {
  const pct = parseInt(percentageInput.value);

  presetBtns.forEach((btn) => {
    const btnPct = parseInt(btn.dataset.pct ?? '0');
    btn.classList.toggle('active', btnPct === pct);
  });

  if (pctPreviewInfo && state.originalWidth && state.originalHeight) {
    if (isNaN(pct) || pct < 1) {
      pctPreviewInfo.textContent = '';
      return;
    }
    const targetW = Math.round(state.originalWidth * (pct / 100));
    const targetH = Math.round(state.originalHeight * (pct / 100));
    pctPreviewInfo.textContent = `Target size: ${targetW} × ${targetH} px`;
  }
}

// Update target file size preset button highlights
function updateTargetPresetHighlights(): void {
  const targetKb = parseInt(targetSizeInput.value);
  targetPresetBtns.forEach((btn) => {
    const btnKb = parseInt(btn.dataset.kb ?? '0');
    btn.classList.toggle('active', btnKb === targetKb);
  });
}

// Set active mode
function setMode(mode: 'dimensions' | 'percentage' | 'targetSize'): void {
  state.mode = mode;

  // Tabs UI
  modeDimBtn.classList.toggle('active', mode === 'dimensions');
  modeDimBtn.setAttribute('aria-selected', String(mode === 'dimensions'));

  modePctBtn.classList.toggle('active', mode === 'percentage');
  modePctBtn.setAttribute('aria-selected', String(mode === 'percentage'));

  modeTargetBtn.classList.toggle('active', mode === 'targetSize');
  modeTargetBtn.setAttribute('aria-selected', String(mode === 'targetSize'));

  // Panels visibility
  controlsDim.hidden = mode !== 'dimensions';
  controlsPct.hidden = mode !== 'percentage';
  controlsTarget.hidden = mode !== 'targetSize';

  // Quality slider visibility (hidden in targetSize mode or PNG)
  const isPng = state.file?.type === 'image/png';
  qualityGroup.hidden = mode === 'targetSize' || isPng;

  if (mode === 'percentage') {
    updatePercentagePreview();
  } else if (mode === 'targetSize') {
    updateTargetPresetHighlights();
  }
}

// Optimization algorithm for Target File Size mode (binary search)
async function optimizeToTargetSize(
  img: HTMLImageElement,
  file: File,
  targetBytes: number
): Promise<{ blob: Blob; width: number; height: number }> {
  const mime = getMimeType(file);

  const encode = (scale: number, quality: number): Promise<{ blob: Blob; width: number; height: number }> => {
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    return new Promise((resolve) => {
      canvas.toBlob(
        (b) => resolve({ blob: b!, width, height }),
        mime,
        mime !== 'image/png' ? quality : undefined
      );
    });
  };

  // For PNG (quality fixed by browser)
  if (mime === 'image/png') {
    let minScale = 0.05;
    let maxScale = 1.0;
    let bestResult: { blob: Blob; width: number; height: number } | null = null;
    let closestResult: { blob: Blob; width: number; height: number } | null = null;

    for (let i = 0; i < 7; i++) {
      const midScale = (minScale + maxScale) / 2;
      const res = await encode(midScale, 1.0);
      closestResult = res;

      if (res.blob.size <= targetBytes) {
        bestResult = res;
        minScale = midScale;
      } else {
        maxScale = midScale;
      }
    }

    return bestResult ?? closestResult!;
  }

  // For JPEG / WebP
  // Test original dimensions at min quality (0.05)
  const minQRes = await encode(1.0, 0.05);

  if (minQRes.blob.size <= targetBytes) {
    // Reachable at 100% scale via quality tuning
    let minQ = 0.05;
    let maxQ = 0.95;
    let bestRes = minQRes;

    for (let i = 0; i < 8; i++) {
      const midQ = (minQ + maxQ) / 2;
      const res = await encode(1.0, midQ);
      if (res.blob.size <= targetBytes) {
        bestRes = res;
        minQ = midQ;
      } else {
        maxQ = midQ;
      }
    }
    return bestRes;
  }

  // Scale down needed because even min quality at 100% scale exceeds target
  let minScale = 0.05;
  let maxScale = 1.0;
  let bestScale = 0.05;

  for (let i = 0; i < 6; i++) {
    const midScale = (minScale + maxScale) / 2;
    const res = await encode(midScale, 0.50);
    if (res.blob.size <= targetBytes) {
      bestScale = midScale;
      minScale = midScale;
    } else {
      maxScale = midScale;
    }
  }

  // Fine tune quality at best scale
  let minQ = 0.05;
  let maxQ = 0.95;
  let finalRes = await encode(bestScale, 0.50);

  for (let i = 0; i < 6; i++) {
    const midQ = (minQ + maxQ) / 2;
    const res = await encode(bestScale, midQ);
    if (res.blob.size <= targetBytes) {
      finalRes = res;
      minQ = midQ;
    } else {
      maxQ = midQ;
    }
  }

  return finalRes;
}

// Load image from file
function loadImage(file: File): void {
  if (!isValidImage(file)) {
    showError(i18n.errorInvalid);
    return;
  }

  state.file = file;
  const reader = new FileReader();

  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      state.originalImage = img;
      state.originalWidth = img.naturalWidth;
      state.originalHeight = img.naturalHeight;
      state.aspectRatio = img.naturalWidth / img.naturalHeight;

      // Update preview
      preview.src = e.target!.result as string;

      // Update info
      infoArea.innerHTML = `
        <span class="info-label">${i18n.infoFilename}</span><span>${file.name}</span>
        <span class="info-label">${i18n.infoFormat}</span><span>${file.type.split('/')[1]?.toUpperCase() ?? 'Unknown'}</span>
        <span class="info-label">${i18n.infoDimensions}</span><span>${img.naturalWidth} × ${img.naturalHeight} px</span>
        <span class="info-label">${i18n.infoOriginalSize}</span><span>${formatSize(file.size)}</span>
      `;

      // Set default values
      widthInput.value = String(img.naturalWidth);
      heightInput.value = String(img.naturalHeight);
      updatePercentagePreview();
      updateTargetPresetHighlights();

      // Ensure active mode UI state
      setMode(state.mode);

      // Show editor, hide upload
      uploadSection.hidden = true;
      editorSection.hidden = false;
      resultSection.hidden = true;
      errorSection.hidden = true;
    };

    img.onerror = () => {
      showError(i18n.errorLoad);
    };

    img.src = e.target!.result as string;
  };

  reader.onerror = () => {
    showError(i18n.errorLoad);
  };

  reader.readAsDataURL(file);
}

// Handle file selection
function handleFile(file: File): void {
  loadImage(file);
}

// Dropzone events
dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragging');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('dragging');
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragging');
  const file = e.dataTransfer?.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) handleFile(file);
});

// Mode switching handlers
modeDimBtn.addEventListener('click', () => setMode('dimensions'));
modePctBtn.addEventListener('click', () => setMode('percentage'));
modeTargetBtn.addEventListener('click', () => setMode('targetSize'));

// Percentage preset buttons
presetBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const pct = btn.dataset.pct;
    if (pct) {
      percentageInput.value = pct;
      updatePercentagePreview();
    }
  });
});

percentageInput.addEventListener('input', () => {
  updatePercentagePreview();
});

// Target size preset buttons
targetPresetBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const kb = btn.dataset.kb;
    if (kb) {
      targetSizeInput.value = kb;
      updateTargetPresetHighlights();
    }
  });
});

targetSizeInput.addEventListener('input', () => {
  updateTargetPresetHighlights();
});

// Aspect ratio lock
widthInput.addEventListener('input', () => {
  if (lockAspect.checked && state.aspectRatio) {
    const w = parseInt(widthInput.value);
    if (!isNaN(w)) {
      heightInput.value = String(Math.round(w / state.aspectRatio));
    }
  }
});

heightInput.addEventListener('input', () => {
  if (lockAspect.checked && state.aspectRatio) {
    const h = parseInt(heightInput.value);
    if (!isNaN(h)) {
      widthInput.value = String(Math.round(h * state.aspectRatio));
    }
  }
});

// Quality display
qualityInput.addEventListener('input', () => {
  qualityValue.textContent = qualityInput.value;
});

// Resize action
btnResize.addEventListener('click', async () => {
  if (!state.originalImage || !state.file) return;

  btnResize.textContent = i18n.statusProcessing;
  btnResize.setAttribute('disabled', 'true');

  try {
    if (state.mode === 'targetSize') {
      const targetKb = parseInt(targetSizeInput.value);
      if (isNaN(targetKb) || targetKb < 1) {
        btnResize.textContent = app!.dataset.i18nActionResize ?? 'Resize';
        btnResize.removeAttribute('disabled');
        return;
      }
      const targetBytes = targetKb * 1024;

      const result = await optimizeToTargetSize(state.originalImage, state.file, targetBytes);

      if (state.resultUrl) {
        URL.revokeObjectURL(state.resultUrl);
      }

      state.resultBlob = result.blob;
      state.resultUrl = URL.createObjectURL(result.blob);

      resultInfo.innerHTML = `
        <span><strong>${i18n.resultNewDimensions}:</strong> ${result.width} × ${result.height} px</span>
        <span><strong>${i18n.resultNewSize}:</strong> ${formatSize(result.blob.size)}</span>
      `;
      resultSection.hidden = false;

      btnResize.textContent = i18n.statusComplete;
      setTimeout(() => {
        btnResize.textContent = app!.dataset.i18nActionResize ?? 'Resize';
        btnResize.removeAttribute('disabled');
      }, 1000);
      return;
    }

    let targetWidth: number;
    let targetHeight: number;

    if (state.mode === 'percentage') {
      const pct = parseInt(percentageInput.value);
      if (isNaN(pct) || pct < 1) {
        btnResize.textContent = app!.dataset.i18nActionResize ?? 'Resize';
        btnResize.removeAttribute('disabled');
        return;
      }
      targetWidth = Math.round(state.originalWidth * (pct / 100));
      targetHeight = Math.round(state.originalHeight * (pct / 100));
    } else {
      targetWidth = parseInt(widthInput.value);
      targetHeight = parseInt(heightInput.value);
      if (isNaN(targetWidth) || isNaN(targetHeight) || targetWidth < 1 || targetHeight < 1) {
        btnResize.textContent = app!.dataset.i18nActionResize ?? 'Resize';
        btnResize.removeAttribute('disabled');
        return;
      }
    }

    requestAnimationFrame(() => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d')!;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(state.originalImage!, 0, 0, targetWidth, targetHeight);

        const mime = getMimeType(state.file!);
        const quality = mime !== 'image/png' ? parseInt(qualityInput.value) / 100 : undefined;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              showError(i18n.errorResize);
              btnResize.textContent = app!.dataset.i18nActionResize ?? 'Resize';
              btnResize.removeAttribute('disabled');
              return;
            }

            if (state.resultUrl) {
              URL.revokeObjectURL(state.resultUrl);
            }

            state.resultBlob = blob;
            state.resultUrl = URL.createObjectURL(blob);

            resultInfo.innerHTML = `
              <span><strong>${i18n.resultNewDimensions}:</strong> ${targetWidth} × ${targetHeight} px</span>
              <span><strong>${i18n.resultNewSize}:</strong> ${formatSize(blob.size)}</span>
            `;
            resultSection.hidden = false;

            btnResize.textContent = i18n.statusComplete;
            setTimeout(() => {
              btnResize.textContent = app!.dataset.i18nActionResize ?? 'Resize';
              btnResize.removeAttribute('disabled');
            }, 1000);
          },
          mime,
          quality
        );
      } catch {
        showError(i18n.errorResize);
        btnResize.textContent = app!.dataset.i18nActionResize ?? 'Resize';
        btnResize.removeAttribute('disabled');
      }
    });
  } catch {
    showError(i18n.errorResize);
    btnResize.textContent = app!.dataset.i18nActionResize ?? 'Resize';
    btnResize.removeAttribute('disabled');
  }
});

// Download
btnDownload.addEventListener('click', () => {
  if (!state.resultUrl || !state.file) return;

  const mime = getMimeType(state.file);
  const ext = getExtension(mime);
  const baseName = state.file.name.replace(/\.[^.]+$/, '');
  const filename = `${baseName}_resized${ext}`;

  const a = document.createElement('a');
  a.href = state.resultUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// New Image
btnNewImage.addEventListener('click', () => {
  if (state.resultUrl) {
    URL.revokeObjectURL(state.resultUrl);
  }

  state.file = null;
  state.originalImage = null;
  state.originalWidth = 0;
  state.originalHeight = 0;
  state.aspectRatio = 1;
  state.resultBlob = null;
  state.resultUrl = null;

  preview.src = '';
  infoArea.innerHTML = '';
  resultInfo.innerHTML = '';
  fileInput.value = '';

  uploadSection.hidden = false;
  editorSection.hidden = true;
  resultSection.hidden = true;
  errorSection.hidden = true;
});
