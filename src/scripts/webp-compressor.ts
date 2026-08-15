/**
 * WebP Image Compressor Client-Side Engine
 * 100% In-Browser Compression via HTML5 Canvas WebP Encoder
 */

interface WebpState {
  file: File | null;
  img: HTMLImageElement | null;
  originalBlob: Blob | null;
  compressedBlob: Blob | null;
  preset: 'balanced' | 'high' | 'max' | 'custom' | 'target';
  quality: number; // 0.1 to 1.0
  targetKb: number; // in KB
}

const state: WebpState = {
  file: null,
  img: null,
  originalBlob: null,
  compressedBlob: null,
  preset: 'balanced',
  quality: 0.8,
  targetKb: 100,
};

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function initWebpCompressor() {
  const container = document.getElementById('webp-compressor-app');
  if (!container) return;

  const dropzone = document.getElementById('webp-dropzone');
  const fileInput = document.getElementById('webp-file-input') as HTMLInputElement | null;
  const editorArea = document.getElementById('webp-editor-area');
  const resultArea = document.getElementById('webp-result-area');
  const errorArea = document.getElementById('webp-error-area');
  const errorMessage = document.getElementById('webp-error-message');

  // Controls
  const presetButtons = document.querySelectorAll<HTMLButtonElement>('.webp-preset-btn');
  const qualityGroup = document.getElementById('webp-quality-group');
  const qualitySlider = document.getElementById('webp-quality-slider') as HTMLInputElement | null;
  const qualityVal = document.getElementById('webp-quality-val');
  const targetGroup = document.getElementById('webp-target-group');
  const targetInput = document.getElementById('webp-target-input') as HTMLInputElement | null;

  // Actions
  const btnCompress = document.getElementById('webp-btn-compress') as HTMLButtonElement | null;
  const btnDownload = document.getElementById('webp-btn-download') as HTMLButtonElement | null;
  const btnNew = document.getElementById('webp-btn-new') as HTMLButtonElement | null;

  // Stats
  const infoFilename = document.getElementById('webp-info-filename');
  const infoOrig = document.getElementById('webp-info-orig');
  const infoComp = document.getElementById('webp-info-comp');
  const infoSaved = document.getElementById('webp-info-saved');
  const infoDim = document.getElementById('webp-info-dim');
  const previewImg = document.getElementById('webp-preview-img') as HTMLImageElement | null;

  function showError(msg: string) {
    if (errorMessage && errorArea) {
      errorMessage.textContent = msg;
      errorArea.hidden = false;
    }
  }

  function hideError() {
    if (errorArea) errorArea.hidden = true;
  }

  function handleFile(file: File) {
    hideError();
    if (!file.type.match(/^image\/(webp|jpeg|png|jpg)$/i)) {
      showError(container?.dataset.i18nInvalid || 'Please select a valid image file (WebP, JPG, or PNG).');
      return;
    }

    state.file = file;
    state.originalBlob = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        state.img = img;
        if (dropzone) dropzone.hidden = true;
        if (editorArea) editorArea.hidden = false;
        if (resultArea) resultArea.hidden = true;

        if (infoFilename) infoFilename.textContent = file.name;
        if (infoOrig) infoOrig.textContent = formatBytes(file.size);
        if (infoDim) infoDim.textContent = `${img.naturalWidth} × ${img.naturalHeight} px`;

        // Set default target KB (roughly 50% of original)
        const defaultTarget = Math.max(10, Math.round((file.size / 1024) * 0.5));
        if (targetInput) targetInput.value = String(defaultTarget);
        state.targetKb = defaultTarget;

        // Auto process with default preset
        compressWebpImage();
      };
      img.onerror = () => {
        showError(container?.dataset.i18nLoadFailed || 'Could not load the image file.');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  // Preset Selection
  presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      presetButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const preset = btn.dataset.preset as WebpState['preset'];
      state.preset = preset;

      if (preset === 'balanced') {
        state.quality = 0.8;
        if (qualityGroup) qualityGroup.hidden = true;
        if (targetGroup) targetGroup.hidden = true;
      } else if (preset === 'high') {
        state.quality = 0.9;
        if (qualityGroup) qualityGroup.hidden = true;
        if (targetGroup) targetGroup.hidden = true;
      } else if (preset === 'max') {
        state.quality = 0.65;
        if (qualityGroup) qualityGroup.hidden = true;
        if (targetGroup) targetGroup.hidden = true;
      } else if (preset === 'custom') {
        if (qualityGroup) qualityGroup.hidden = false;
        if (targetGroup) targetGroup.hidden = true;
        if (qualitySlider) state.quality = Number(qualitySlider.value) / 100;
      } else if (preset === 'target') {
        if (qualityGroup) qualityGroup.hidden = true;
        if (targetGroup) targetGroup.hidden = false;
        if (targetInput) state.targetKb = Number(targetInput.value) || 50;
      }

      compressWebpImage();
    });
  });

  // Slider change
  qualitySlider?.addEventListener('input', () => {
    const val = Number(qualitySlider.value);
    if (qualityVal) qualityVal.textContent = `${val}%`;
    state.quality = val / 100;
  });

  qualitySlider?.addEventListener('change', () => {
    compressWebpImage();
  });

  // Target KB change
  targetInput?.addEventListener('change', () => {
    state.targetKb = Math.max(5, Number(targetInput.value) || 50);
    compressWebpImage();
  });

  async function compressWebpImage() {
    if (!state.img || !state.file) return;

    if (btnCompress) {
      btnCompress.disabled = true;
      btnCompress.textContent = container?.dataset.i18nProcessing || 'Compressing WebP...';
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = state.img.naturalWidth;
      canvas.height = state.img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      ctx.drawImage(state.img, 0, 0);

      let outputBlob: Blob | null = null;

      if (state.preset === 'target') {
        // Binary search for closest quality matching target KB
        const targetBytes = state.targetKb * 1024;
        let minQ = 0.05;
        let maxQ = 0.98;
        let bestBlob: Blob | null = null;

        for (let iter = 0; iter < 6; iter++) {
          const midQ = (minQ + maxQ) / 2;
          const currentBlob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((b) => resolve(b), 'image/webp', midQ);
          });

          if (currentBlob) {
            bestBlob = currentBlob;
            if (currentBlob.size > targetBytes) {
              maxQ = midQ;
            } else {
              minQ = midQ;
            }
          }
        }
        outputBlob = bestBlob;
      } else {
        // Direct Quality Compression
        outputBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/webp', state.quality);
        });
      }

      if (!outputBlob) throw new Error('Compression produced null blob');

      state.compressedBlob = outputBlob;

      // Update Result UI
      if (previewImg) {
        previewImg.src = URL.createObjectURL(outputBlob);
      }
      if (infoComp) infoComp.textContent = formatBytes(outputBlob.size);

      const savedBytes = state.file.size - outputBlob.size;
      const savedPercent = Math.round((savedBytes / state.file.size) * 100);

      if (infoSaved) {
        if (savedPercent > 0) {
          infoSaved.textContent = `-${savedPercent}% (${formatBytes(savedBytes)})`;
          infoSaved.className = 'saved-badge positive';
        } else {
          infoSaved.textContent = `+${Math.abs(savedPercent)}% (Already minimal)`;
          infoSaved.className = 'saved-badge neutral';
        }
      }

      if (resultArea) {
        resultArea.hidden = false;
        // Smooth scroll to the result and download section
        setTimeout(() => {
          resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (err) {
      console.error(err);
      showError(container?.dataset.i18nProcessFailed || 'Compression failed. Please try again.');
    } finally {
      if (btnCompress) {
        btnCompress.disabled = false;
        btnCompress.textContent = container?.dataset.i18nCompress || 'Compress WebP';
      }
    }
  }

  btnCompress?.addEventListener('click', () => {
    compressWebpImage();
  });

  btnDownload?.addEventListener('click', () => {
    if (!state.compressedBlob || !state.file) return;

    const baseName = state.file.name.replace(/\.[^/.]+$/, '');
    const filename = `${baseName}-compressed.webp`;

    const url = URL.createObjectURL(state.compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  btnNew?.addEventListener('click', () => {
    state.file = null;
    state.img = null;
    state.originalBlob = null;
    state.compressedBlob = null;
    if (fileInput) fileInput.value = '';
    if (dropzone) dropzone.hidden = false;
    if (editorArea) editorArea.hidden = true;
    if (resultArea) resultArea.hidden = true;
    hideError();
  });

  // Dropzone Events
  dropzone?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      handleFile(fileInput.files[0]);
    }
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('drag-over');
    });
  });

  dropzone?.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files[0]) {
      handleFile(dt.files[0]);
    }
  });
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWebpCompressor);
} else {
  initWebpCompressor();
}
