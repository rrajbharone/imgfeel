/**
 * Exact Dimension Image Resizer — Fast, 100% Client-Side Canvas Engine
 */

export interface ResizeOptions {
  width: number;
  height: number;
  mode: 'fit' | 'crop' | 'pad';
  padColor: 'white' | 'black' | 'transparent';
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  quality: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function initExactResizer() {
  const root = document.getElementById('exact-resizer-app');
  if (!root) return;

  const dropzone = document.getElementById('exact-dropzone') as HTMLElement | null;
  const fileInput = document.getElementById('exact-file-input') as HTMLInputElement | null;
  const uploadArea = document.getElementById('exact-upload') as HTMLElement | null;
  const editorArea = document.getElementById('exact-editor') as HTMLElement | null;
  const previewImg = document.getElementById('exact-preview') as HTMLImageElement | null;
  const infoEl = document.getElementById('exact-info') as HTMLElement | null;
  const widthInput = document.getElementById('exact-width') as HTMLInputElement | null;
  const heightInput = document.getElementById('exact-height') as HTMLInputElement | null;
  const lockAspectCheckbox = document.getElementById('exact-lock-aspect') as HTMLInputElement | null;
  const modeRadios = document.querySelectorAll<HTMLInputElement>('input[name="exact-fit-mode"]');
  const padColorGroup = document.getElementById('exact-pad-color-group') as HTMLElement | null;
  const padColorSelect = document.getElementById('exact-pad-color') as HTMLSelectElement | null;
  const formatSelect = document.getElementById('exact-format') as HTMLSelectElement | null;
  const qualityGroup = document.getElementById('exact-quality-group') as HTMLElement | null;
  const qualityInput = document.getElementById('exact-quality') as HTMLInputElement | null;
  const qualityVal = document.getElementById('exact-quality-val') as HTMLElement | null;
  const btnResize = document.getElementById('exact-btn-resize') as HTMLButtonElement | null;
  const resultArea = document.getElementById('exact-result') as HTMLElement | null;
  const resultInfo = document.getElementById('exact-result-info') as HTMLElement | null;
  const btnDownload = document.getElementById('exact-btn-download') as HTMLButtonElement | null;
  const btnNew = document.getElementById('exact-btn-new') as HTMLButtonElement | null;
  const errorArea = document.getElementById('exact-error') as HTMLElement | null;
  const errorMsg = document.getElementById('exact-error-msg') as HTMLElement | null;
  const presetBtns = document.querySelectorAll<HTMLButtonElement>('.exact-preset-btn');

  // Translations
  const i18n = {
    filename: root.getAttribute('data-i18n-info-filename') || 'File Name',
    origDimensions: root.getAttribute('data-i18n-info-orig-dimensions') || 'Original Dimensions',
    origSize: root.getAttribute('data-i18n-info-orig-size') || 'Original Size',
    targetDimensions: root.getAttribute('data-i18n-info-target-dimensions') || 'Target Dimensions',
    outputSize: root.getAttribute('data-i18n-info-output-size') || 'Output Size',
    invalidFile: root.getAttribute('data-i18n-error-invalid') || 'Please select a valid image file.',
    loadFailed: root.getAttribute('data-i18n-error-load') || 'Could not load image file.',
    processFailed: root.getAttribute('data-i18n-error-process') || 'Failed to resize image.',
    processing: root.getAttribute('data-i18n-status-processing') || 'Resizing image...',
  };

  let currentFile: File | null = null;
  let originalImage: HTMLImageElement | null = null;
  let originalWidth = 0;
  let originalHeight = 0;
  let originalAspectRatio = 1;
  let resizedBlob: Blob | null = null;
  let resizedUrl: string | null = null;

  function showError(msg: string) {
    if (errorArea && errorMsg) {
      errorMsg.textContent = msg;
      errorArea.hidden = false;
    }
  }

  function hideError() {
    if (errorArea) {
      errorArea.hidden = true;
    }
  }

  function handleFile(file: File) {
    hideError();
    if (!file.type.match(/^image\/(jpeg|png|webp)/i)) {
      showError(i18n.invalidFile);
      return;
    }

    currentFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        originalImage = img;
        originalWidth = img.naturalWidth;
        originalHeight = img.naturalHeight;
        originalAspectRatio = originalWidth / originalHeight;

        if (previewImg) {
          previewImg.src = img.src;
        }

        if (widthInput) widthInput.value = String(originalWidth);
        if (heightInput) heightInput.value = String(originalHeight);

        updateInfoPanel();
        updateFormatUI();

        if (uploadArea) uploadArea.hidden = true;
        if (editorArea) editorArea.hidden = false;
        if (resultArea) resultArea.hidden = true;
      };
      img.onerror = () => {
        showError(i18n.loadFailed);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function updateInfoPanel() {
    if (!infoEl || !currentFile) return;
    infoEl.innerHTML = `
      <div class="info-row"><span class="info-label">${i18n.filename}:</span> <span class="info-val">${currentFile.name}</span></div>
      <div class="info-row"><span class="info-label">${i18n.origDimensions}:</span> <span class="info-val">${originalWidth} × ${originalHeight} px</span></div>
      <div class="info-row"><span class="info-label">${i18n.origSize}:</span> <span class="info-val">${formatBytes(currentFile.size)}</span></div>
    `;
  }

  function updateFormatUI() {
    const format = formatSelect?.value || 'image/jpeg';
    if (qualityGroup) {
      qualityGroup.style.display = format === 'image/png' ? 'none' : 'flex';
    }
  }

  function updatePadColorUI() {
    const selectedMode = (document.querySelector('input[name="exact-fit-mode"]:checked') as HTMLInputElement)?.value;
    if (padColorGroup) {
      padColorGroup.style.display = selectedMode === 'pad' ? 'flex' : 'none';
    }
  }

  // Dimension Handlers
  widthInput?.addEventListener('input', () => {
    if (lockAspectCheckbox?.checked && widthInput && heightInput && originalAspectRatio > 0) {
      const w = parseFloat(widthInput.value);
      if (!isNaN(w) && w > 0) {
        heightInput.value = String(Math.round(w / originalAspectRatio));
      }
    }
  });

  heightInput?.addEventListener('input', () => {
    if (lockAspectCheckbox?.checked && widthInput && heightInput && originalAspectRatio > 0) {
      const h = parseFloat(heightInput.value);
      if (!isNaN(h) && h > 0) {
        widthInput.value = String(Math.round(h * originalAspectRatio));
      }
    }
  });

  modeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      updatePadColorUI();
    });
  });

  formatSelect?.addEventListener('change', updateFormatUI);

  qualityInput?.addEventListener('input', () => {
    if (qualityVal && qualityInput) {
      qualityVal.textContent = qualityInput.value;
    }
  });

  // Preset Buttons
  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const w = btn.getAttribute('data-w');
      const h = btn.getAttribute('data-h');
      if (w && h && widthInput && heightInput) {
        if (lockAspectCheckbox) lockAspectCheckbox.checked = false;
        widthInput.value = w;
        heightInput.value = h;
      }
    });
  });

  // Drag & Drop
  if (dropzone) {
    ['dragenter', 'dragover'].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dropzone-active');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dropzone-active');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    });

    dropzone.addEventListener('click', () => {
      fileInput?.click();
    });
  }

  fileInput?.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  });

  // Resize Execution
  btnResize?.addEventListener('click', async () => {
    if (!originalImage || !widthInput || !heightInput) return;
    hideError();

    const targetW = parseInt(widthInput.value, 10);
    const targetH = parseInt(heightInput.value, 10);

    if (isNaN(targetW) || targetW <= 0 || isNaN(targetH) || targetH <= 0) {
      showError(i18n.processFailed);
      return;
    }

    if (btnResize) {
      btnResize.disabled = true;
      btnResize.textContent = i18n.processing;
    }

    try {
      const selectedMode = ((document.querySelector('input[name="exact-fit-mode"]:checked') as HTMLInputElement)?.value || 'fit') as 'fit' | 'crop' | 'pad';
      const padColor = (padColorSelect?.value || 'white') as 'white' | 'black' | 'transparent';
      const format = (formatSelect?.value || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp';
      const quality = parseInt(qualityInput?.value || '90', 10) / 100;

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context unavailable');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (selectedMode === 'fit') {
        // Stretch / direct fit
        ctx.drawImage(originalImage, 0, 0, targetW, targetH);
      } else if (selectedMode === 'crop') {
        // Center Crop (fill target frame)
        const scale = Math.max(targetW / originalWidth, targetH / originalHeight);
        const drawW = originalWidth * scale;
        const drawH = originalHeight * scale;
        const offsetX = (targetW - drawW) / 2;
        const offsetY = (targetH - drawH) / 2;
        ctx.drawImage(originalImage, offsetX, offsetY, drawW, drawH);
      } else if (selectedMode === 'pad') {
        // Pad / Letterbox (contain within target frame)
        if (padColor === 'white') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetW, targetH);
        } else if (padColor === 'black') {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, targetW, targetH);
        } else {
          ctx.clearRect(0, 0, targetW, targetH);
        }

        const scale = Math.min(targetW / originalWidth, targetH / originalHeight);
        const drawW = originalWidth * scale;
        const drawH = originalHeight * scale;
        const offsetX = (targetW - drawW) / 2;
        const offsetY = (targetH - drawH) / 2;
        ctx.drawImage(originalImage, offsetX, offsetY, drawW, drawH);
      }

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), format, quality);
      });

      if (!blob) {
        throw new Error('Failed to generate image blob');
      }

      if (resizedUrl) {
        URL.revokeObjectURL(resizedUrl);
      }

      resizedBlob = blob;
      resizedUrl = URL.createObjectURL(blob);

      if (resultInfo) {
        resultInfo.innerHTML = `
          <div class="result-row"><span class="info-label">${i18n.targetDimensions}:</span> <span class="info-val highlight">${targetW} × ${targetH} px</span></div>
          <div class="result-row"><span class="info-label">${i18n.outputSize}:</span> <span class="info-val highlight">${formatBytes(blob.size)}</span></div>
        `;
      }

      if (resultArea) {
        resultArea.hidden = false;
        resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (err) {
      showError(i18n.processFailed);
    } finally {
      if (btnResize) {
        btnResize.disabled = false;
        btnResize.textContent = root.getAttribute('data-i18n-action-resize') || 'Resize Image';
      }
    }
  });

  // Download Handler
  btnDownload?.addEventListener('click', () => {
    if (!resizedBlob || !currentFile || !widthInput || !heightInput) return;
    const targetW = widthInput.value;
    const targetH = heightInput.value;
    const format = formatSelect?.value || 'image/jpeg';
    const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
    const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
    const outName = `${baseName}-${targetW}x${targetH}.${ext}`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(resizedBlob);
    link.download = outName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // New Image Reset
  btnNew?.addEventListener('click', () => {
    if (resizedUrl) {
      URL.revokeObjectURL(resizedUrl);
      resizedUrl = null;
    }
    resizedBlob = null;
    currentFile = null;
    originalImage = null;
    if (fileInput) fileInput.value = '';
    if (uploadArea) uploadArea.hidden = false;
    if (editorArea) editorArea.hidden = true;
    if (resultArea) resultArea.hidden = true;
    hideError();
  });

  updatePadColorUI();
  updateFormatUI();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExactResizer);
} else {
  initExactResizer();
}
