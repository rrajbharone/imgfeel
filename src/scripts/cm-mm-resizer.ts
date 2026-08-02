/**
 * ImgFeel CM & MM Image Resizer — Client-side physical dimension processing
 * Pure vanilla JS, Canvas API, zero dependencies
 */

interface CmMmState {
  file: File | null;
  originalImage: HTMLImageElement | null;
  originalWidth: number;
  originalHeight: number;
  aspectRatio: number;
  unit: 'cm' | 'mm';
  dpi: number;
  targetPxW: number;
  targetPxH: number;
  resultBlob: Blob | null;
  resultUrl: string | null;
}

const app = document.getElementById('cm-mm-resizer-app');
if (!app) throw new Error('CM-MM Resizer app container not found');

// i18n strings from dataset
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
  calcLabel: app.dataset.i18nCalcLabel ?? 'Calculated Pixel Size',
};

// DOM Elements
const uploadSection = document.getElementById('cm-upload')!;
const editorSection = document.getElementById('cm-editor')!;
const errorSection = document.getElementById('cm-error')!;
const dropzone = document.getElementById('cm-dropzone')!;
const fileInput = document.getElementById('cm-file-input') as HTMLInputElement;
const preview = document.getElementById('cm-preview') as HTMLImageElement;
const infoArea = document.getElementById('cm-info')!;
const resultSection = document.getElementById('cm-result')!;
const resultInfo = document.getElementById('cm-result-info')!;
const errorMessage = document.getElementById('cm-error-msg')!;

const unitCmBtn = document.getElementById('unit-cm')!;
const unitMmBtn = document.getElementById('unit-mm')!;
const unitLabelW = document.getElementById('unit-label-w')!;
const unitLabelH = document.getElementById('unit-label-h')!;

const widthInput = document.getElementById('cm-width') as HTMLInputElement;
const heightInput = document.getElementById('cm-height') as HTMLInputElement;
const lockAspect = document.getElementById('cm-lock-aspect') as HTMLInputElement;

const dpiInput = document.getElementById('cm-dpi') as HTMLInputElement;
const dpiBtns = document.querySelectorAll<HTMLButtonElement>('.dpi-btn');
const calcValueDisplay = document.getElementById('calc-value')!;

const qualityGroup = document.getElementById('cm-quality-group')!;
const qualityInput = document.getElementById('cm-quality') as HTMLInputElement;
const qualityValue = document.getElementById('cm-quality-val')!;

const btnResize = document.getElementById('cm-btn-resize')!;
const btnDownload = document.getElementById('cm-btn-download')!;
const btnNewImage = document.getElementById('cm-btn-new')!;

// State
const state: CmMmState = {
  file: null,
  originalImage: null,
  originalWidth: 0,
  originalHeight: 0,
  aspectRatio: 1,
  unit: 'cm',
  dpi: 300,
  targetPxW: 0,
  targetPxH: 0,
  resultBlob: null,
  resultUrl: null,
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getMimeType(file: File): string {
  if (file.type === 'image/png') return 'image/png';
  if (file.type === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

function getExtension(mime: string): string {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '.jpg';
}

function showError(msg: string): void {
  errorMessage.textContent = msg;
  errorSection.hidden = false;
  setTimeout(() => {
    errorSection.hidden = true;
  }, 5000);
}

function isValidImage(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Formula:
 * CM to Pixels: cm * dpi / 2.54
 * MM to Pixels: mm * dpi / 25.4
 */
function recalculatePixels(): void {
  const valW = parseFloat(widthInput.value);
  const valH = parseFloat(heightInput.value);
  const dpi = parseInt(dpiInput.value);

  if (isNaN(valW) || isNaN(valH) || isNaN(dpi) || valW <= 0 || valH <= 0 || dpi <= 0) {
    calcValueDisplay.textContent = '—';
    return;
  }

  const factor = state.unit === 'cm' ? 2.54 : 25.4;
  const pxW = Math.round((valW * dpi) / factor);
  const pxH = Math.round((valH * dpi) / factor);

  state.targetPxW = pxW;
  state.targetPxH = pxH;
  state.dpi = dpi;

  calcValueDisplay.textContent = `${pxW} × ${pxH} px`;
}

function setUnit(newUnit: 'cm' | 'mm'): void {
  if (state.unit === newUnit) return;

  const currentW = parseFloat(widthInput.value);
  const currentH = parseFloat(heightInput.value);

  state.unit = newUnit;
  unitCmBtn.classList.toggle('active', newUnit === 'cm');
  unitMmBtn.classList.toggle('active', newUnit === 'mm');
  unitLabelW.textContent = newUnit;
  unitLabelH.textContent = newUnit;

  if (!isNaN(currentW) && !isNaN(currentH)) {
    if (newUnit === 'mm') {
      // CM to MM: multiply by 10
      widthInput.value = (currentW * 10).toFixed(1);
      heightInput.value = (currentH * 10).toFixed(1);
    } else {
      // MM to CM: divide by 10
      widthInput.value = (currentW / 10).toFixed(1);
      heightInput.value = (currentH / 10).toFixed(1);
    }
  }

  recalculatePixels();
}

function updateDpiHighlight(): void {
  const dpi = parseInt(dpiInput.value);
  dpiBtns.forEach((btn) => {
    const btnDpi = parseInt(btn.dataset.dpi ?? '0');
    btn.classList.toggle('active', btnDpi === dpi);
  });
}

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

      preview.src = e.target!.result as string;

      infoArea.innerHTML = `
        <span class="info-label">${i18n.infoFilename}</span><span>${file.name}</span>
        <span class="info-label">${i18n.infoFormat}</span><span>${file.type.split('/')[1]?.toUpperCase() ?? 'Unknown'}</span>
        <span class="info-label">${i18n.infoDimensions}</span><span>${img.naturalWidth} × ${img.naturalHeight} px</span>
        <span class="info-label">${i18n.infoOriginalSize}</span><span>${formatSize(file.size)}</span>
      `;

      // Default physical size based on 300 DPI: cm = px * 2.54 / 300
      const defaultCmW = (img.naturalWidth * 2.54) / 300;
      const defaultCmH = (img.naturalHeight * 2.54) / 300;

      if (state.unit === 'cm') {
        widthInput.value = defaultCmW.toFixed(1);
        heightInput.value = defaultCmH.toFixed(1);
      } else {
        widthInput.value = (defaultCmW * 10).toFixed(1);
        heightInput.value = (defaultCmH * 10).toFixed(1);
      }

      qualityGroup.hidden = file.type === 'image/png';

      recalculatePixels();

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

// Event Listeners
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
  if (file) loadImage(file);
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) loadImage(file);
});

unitCmBtn.addEventListener('click', () => setUnit('cm'));
unitMmBtn.addEventListener('click', () => setUnit('mm'));

widthInput.addEventListener('input', () => {
  if (lockAspect.checked && state.aspectRatio) {
    const valW = parseFloat(widthInput.value);
    if (!isNaN(valW) && valW > 0) {
      heightInput.value = (valW / state.aspectRatio).toFixed(1);
    }
  }
  recalculatePixels();
});

heightInput.addEventListener('input', () => {
  if (lockAspect.checked && state.aspectRatio) {
    const valH = parseFloat(heightInput.value);
    if (!isNaN(valH) && valH > 0) {
      widthInput.value = (valH * state.aspectRatio).toFixed(1);
    }
  }
  recalculatePixels();
});

dpiInput.addEventListener('input', () => {
  updateDpiHighlight();
  recalculatePixels();
});

dpiBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const dpi = btn.dataset.dpi;
    if (dpi) {
      dpiInput.value = dpi;
      updateDpiHighlight();
      recalculatePixels();
    }
  });
});

qualityInput.addEventListener('input', () => {
  qualityValue.textContent = qualityInput.value;
});

// Resize button action
btnResize.addEventListener('click', () => {
  if (!state.originalImage || !state.file) return;

  recalculatePixels();
  if (state.targetPxW < 1 || state.targetPxH < 1) {
    showError(i18n.errorResize);
    return;
  }

  btnResize.textContent = i18n.statusProcessing;
  btnResize.setAttribute('disabled', 'true');

  requestAnimationFrame(() => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = state.targetPxW;
      canvas.height = state.targetPxH;
      const ctx = canvas.getContext('2d')!;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(state.originalImage!, 0, 0, state.targetPxW, state.targetPxH);

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

          const wVal = parseFloat(widthInput.value);
          const hVal = parseFloat(heightInput.value);

          resultInfo.innerHTML = `
            <span><strong>${i18n.resultNewDimensions}:</strong> ${state.targetPxW} × ${state.targetPxH} px (${wVal} × ${hVal} ${state.unit} @ ${state.dpi} DPI)</span>
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
});

// Download
btnDownload.addEventListener('click', () => {
  if (!state.resultUrl || !state.file) return;

  const mime = getMimeType(state.file);
  const ext = getExtension(mime);
  const baseName = state.file.name.replace(/\.[^.]+$/, '');
  const filename = `${baseName}_${widthInput.value}${state.unit}_${state.dpi}dpi${ext}`;

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
