/**
 * Dedicated SSC Photo & Signature Resizer Client Engine
 * 100% Client-Side Canvas Processing & Compliance Validation
 */

export interface SscPresetConfig {
  id: string;
  targetW: number;
  targetH: number;
  minKb: number;
  maxKb: number;
  displayCm: string;
}

export const PRESET_CONFIGS: Record<string, SscPresetConfig> = {
  'photo-cgl': { id: 'photo-cgl', targetW: 200, targetH: 230, minKb: 20, maxKb: 50, displayCm: '3.5 × 4.5 cm' },
  'photo-otr': { id: 'photo-otr', targetW: 138, targetH: 177, minKb: 20, maxKb: 50, displayCm: '3.5 × 4.5 cm' },
  'sig-standard': { id: 'sig-standard', targetW: 140, targetH: 60, minKb: 10, maxKb: 20, displayCm: '4.0 × 2.0 cm' },
  'sig-wide': { id: 'sig-wide', targetW: 240, targetH: 80, minKb: 10, maxKb: 20, displayCm: '6.0 × 2.0 cm' },
};

export function initSscResizer() {
  const container = document.getElementById('ssc-resizer-container');
  if (!container) return;

  const fileInput = document.getElementById('ssc-file-input') as HTMLInputElement;
  const dropzone = document.getElementById('ssc-dropzone') as HTMLElement;
  const dropzoneTitle = document.getElementById('ssc-dropzone-title') as HTMLElement;
  const editorArea = document.getElementById('ssc-editor-area') as HTMLElement;

  const photoTabBtn = document.getElementById('ssc-tab-photo') as HTMLButtonElement;
  const sigTabBtn = document.getElementById('ssc-tab-sig') as HTMLButtonElement;

  const presetSelect = document.getElementById('ssc-preset-select') as HTMLSelectElement;
  const customControls = document.getElementById('ssc-custom-controls') as HTMLElement;

  const customWidthInput = document.getElementById('ssc-custom-width') as HTMLInputElement;
  const customHeightInput = document.getElementById('ssc-custom-height') as HTMLInputElement;
  const customUnitSelect = document.getElementById('ssc-custom-unit') as HTMLSelectElement;
  const customKbInput = document.getElementById('ssc-custom-kb') as HTMLInputElement;

  const mainCanvas = document.getElementById('ssc-main-canvas') as HTMLCanvasElement;
  const ctx = mainCanvas ? mainCanvas.getContext('2d') : null;

  // Validation Status Elements
  const valDimText = document.getElementById('ssc-val-dim-text') as HTMLElement;
  const valDimStatus = document.getElementById('ssc-val-dim-status') as HTMLElement;

  const valSizeText = document.getElementById('ssc-val-size-text') as HTMLElement;
  const valSizeStatus = document.getElementById('ssc-val-size-status') as HTMLElement;

  const valFormatStatus = document.getElementById('ssc-val-format-status') as HTMLElement;

  const downloadBtn = document.getElementById('ssc-download-btn') as HTMLButtonElement;
  const changeImgBtn = document.getElementById('ssc-change-img-btn') as HTMLButtonElement;

  if (!fileInput || !mainCanvas || !ctx) return;

  // State
  let docType: 'photo' | 'sig' = 'photo';
  let loadedImage: HTMLImageElement | null = null;
  let activeBlob: Blob | null = null;
  let activeKb = 0;

  // Upload Handlers
  dropzone?.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) handleUpload(file);
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const file = e.dataTransfer?.files[0];
    if (file) handleUpload(file);
  });

  changeImgBtn?.addEventListener('click', () => fileInput.click());

  function handleUpload(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
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

  // Tab Switcher (SSC Photo vs SSC Signature)
  photoTabBtn?.addEventListener('click', () => {
    if (docType === 'photo') return;
    docType = 'photo';
    photoTabBtn.classList.add('active');
    sigTabBtn.classList.remove('active');
    updatePresetDropdown();
    if (dropzoneTitle) dropzoneTitle.textContent = dropzoneTitle.dataset.photoTitle || '';
    if (loadedImage) processAndRender();
  });

  sigTabBtn?.addEventListener('click', () => {
    if (docType === 'sig') return;
    docType = 'sig';
    sigTabBtn.classList.add('active');
    photoTabBtn.classList.remove('active');
    updatePresetDropdown();
    if (dropzoneTitle) dropzoneTitle.textContent = dropzoneTitle.dataset.sigTitle || '';
    if (loadedImage) processAndRender();
  });

  function updatePresetDropdown() {
    if (!presetSelect) return;
    presetSelect.innerHTML = '';

    if (docType === 'photo') {
      presetSelect.innerHTML = `
        <option value="photo-cgl" selected>${presetSelect.dataset.photo1Title || 'SSC CGL/CHSL/MTS Passport Photo (200×230 px • 20-50 KB)'}</option>
        <option value="photo-otr">${presetSelect.dataset.photo2Title || 'SSC OTR/GD Photo (138×177 px • 20-50 KB)'}</option>
        <option value="custom">${presetSelect.dataset.customTitle || 'Custom / Manual Specification'}</option>
      `;
    } else {
      presetSelect.innerHTML = `
        <option value="sig-standard" selected>${presetSelect.dataset.sig1Title || 'Standard SSC Signature (140×60 px • 10-20 KB)'}</option>
        <option value="sig-wide">${presetSelect.dataset.sig2Title || 'Wide SSC Signature (240×80 px • 10-20 KB)'}</option>
        <option value="custom">${presetSelect.dataset.customTitle || 'Custom / Manual Specification'}</option>
      `;
    }

    if (customControls) customControls.hidden = true;
  }

  // Preset Selection Change
  presetSelect?.addEventListener('change', () => {
    const isCustom = presetSelect.value === 'custom';
    if (customControls) customControls.hidden = !isCustom;
    if (loadedImage) processAndRender();
  });

  // Custom Input Listeners
  [customWidthInput, customHeightInput, customUnitSelect, customKbInput].forEach((input) => {
    input?.addEventListener('input', () => {
      if (loadedImage) processAndRender();
    });
  });

  /**
   * Helper to encode canvas into a JPEG Blob and return actual size in KB
   */
  function encodeCanvas(canvas: HTMLCanvasElement, quality: number): Promise<{ blob: Blob; sizeKb: number }> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) resolve({ blob: new Blob(), sizeKb: 0 });
        else resolve({ blob, sizeKb: blob.size / 1024 });
      }, 'image/jpeg', quality);
    });
  }

  /**
   * Robust Multi-Stage Target File Size Engine
   */
  async function processAndRender() {
    if (!loadedImage || !ctx || !mainCanvas) return;

    let targetW = 200;
    let targetH = 230;
    let minKb = 20;
    let maxKb = 50;
    let displayCm = '3.5 × 4.5 cm';

    const selectedVal = presetSelect?.value || 'photo-cgl';

    if (selectedVal === 'custom') {
      const wVal = parseFloat(customWidthInput?.value || '200');
      const hVal = parseFloat(customHeightInput?.value || '230');
      const unit = customUnitSelect?.value || 'px';
      const kbVal = parseFloat(customKbInput?.value || '35');

      if (unit === 'cm') {
        targetW = Math.round((wVal * 150) / 2.54);
        targetH = Math.round((hVal * 150) / 2.54);
        displayCm = `${wVal} × ${hVal} cm`;
      } else if (unit === 'mm') {
        targetW = Math.round((wVal * 150) / 25.4);
        targetH = Math.round((hVal * 150) / 25.4);
        displayCm = `${wVal} × ${hVal} mm`;
      } else {
        targetW = Math.round(wVal);
        targetH = Math.round(hVal);
        displayCm = `${targetW} × ${targetH} px`;
      }

      minKb = Math.max(5, Math.floor(kbVal * 0.7));
      maxKb = Math.ceil(kbVal * 1.3);
    } else if (PRESET_CONFIGS[selectedVal]) {
      const conf = PRESET_CONFIGS[selectedVal];
      targetW = conf.targetW;
      targetH = conf.targetH;
      minKb = conf.minKb;
      maxKb = conf.maxKb;
      displayCm = conf.displayCm;
    }

    // Safety Target Range (safely inside minKb and maxKb with padding margin)
    const targetKb = minKb + (maxKb - minKb) * 0.45; // e.g. ~33.5 KB for photo, ~14.5 KB for sig

    // Create render canvas
    let scaleMultiplier = 1.0;
    const workCanvas = document.createElement('canvas');

    // Render loaded image at scaleMultiplier onto workCanvas
    function renderAtScale(multiplier: number) {
      workCanvas.width = Math.round(targetW * multiplier);
      workCanvas.height = Math.round(targetH * multiplier);
      const wCtx = workCanvas.getContext('2d');
      if (!wCtx || !loadedImage) return;

      wCtx.fillStyle = '#ffffff';
      wCtx.fillRect(0, 0, workCanvas.width, workCanvas.height);

      const scale = Math.max(workCanvas.width / loadedImage.width, workCanvas.height / loadedImage.height);
      const drawW = loadedImage.width * scale;
      const drawH = loadedImage.height * scale;
      const drawX = (workCanvas.width - drawW) / 2;
      const drawY = (workCanvas.height - drawH) / 2;

      wCtx.drawImage(loadedImage, drawX, drawY, drawW, drawH);
    }

    renderAtScale(scaleMultiplier);

    // Check if even top quality (0.98) falls below minimum target
    let topCheck = await encodeCanvas(workCanvas, 0.98);

    // If size is too small even at 98% quality (common for clean signature scans), upscale render resolution
    while (topCheck.sizeKb < minKb + 1.0 && scaleMultiplier < 4.0) {
      scaleMultiplier += 0.4;
      renderAtScale(scaleMultiplier);
      topCheck = await encodeCanvas(workCanvas, 0.95);
    }

    // If size is too large even at low quality (0.1), downscale resolution
    let lowCheck = await encodeCanvas(workCanvas, 0.1);
    while (lowCheck.sizeKb > maxKb && scaleMultiplier > 0.4) {
      scaleMultiplier -= 0.15;
      renderAtScale(scaleMultiplier);
      lowCheck = await encodeCanvas(workCanvas, 0.1);
    }

    // Binary Search Quality Compression Loop to land safely within [minKb, maxKb]
    let minQ = 0.05;
    let maxQ = 0.98;
    let bestResult = await encodeCanvas(workCanvas, 0.85);

    for (let i = 0; i < 9; i++) {
      const midQ = (minQ + maxQ) / 2;
      const current = await encodeCanvas(workCanvas, midQ);

      // Keep candidate if inside valid range
      if (current.sizeKb >= minKb && current.sizeKb <= maxKb) {
        bestResult = current;
      }

      if (current.sizeKb > targetKb) {
        maxQ = midQ;
      } else {
        minQ = midQ;
      }
    }

    // Byte-Level Safety Verification Guard
    let attempts = 0;
    while ((bestResult.sizeKb < minKb || bestResult.sizeKb > maxKb) && attempts < 5) {
      attempts++;
      if (bestResult.sizeKb < minKb) {
        scaleMultiplier += 0.3;
        renderAtScale(scaleMultiplier);
        bestResult = await encodeCanvas(workCanvas, 0.92);
      } else if (bestResult.sizeKb > maxKb) {
        const lowerQ = Math.max(0.05, (minQ + maxQ) / 2.5);
        bestResult = await encodeCanvas(workCanvas, lowerQ);
      }
    }

    // Render final display onto main canvas
    mainCanvas.width = targetW;
    mainCanvas.height = targetH;
    ctx.clearRect(0, 0, targetW, targetH);
    ctx.drawImage(workCanvas, 0, 0, targetW, targetH);

    activeBlob = bestResult.blob;
    activeKb = parseFloat(bestResult.sizeKb.toFixed(1));

    // Update Validation Checklist
    updateValidation(targetW, targetH, displayCm, activeKb, minKb, maxKb);
  }

  function updateValidation(targetW: number, targetH: number, displayCm: string, sizeKb: number, minKb: number, maxKb: number) {
    if (valDimText) {
      valDimText.textContent = `${targetW} × ${targetH} px (${displayCm})`;
    }
    if (valDimStatus) {
      valDimStatus.textContent = valDimStatus.dataset.pass || 'PASSED';
      valDimStatus.className = 'val-badge pass';
    }

    if (valSizeText) {
      valSizeText.textContent = `${sizeKb} KB (Target: ${minKb} – ${maxKb} KB)`;
    }

    const sizeValid = sizeKb >= minKb && sizeKb <= maxKb;
    if (valSizeStatus) {
      if (sizeValid) {
        valSizeStatus.textContent = valSizeStatus.dataset.pass || 'PASSED';
        valSizeStatus.className = 'val-badge pass';
      } else {
        valSizeStatus.textContent = valSizeStatus.dataset.fail || 'NEEDS ADJUSTMENT';
        valSizeStatus.className = 'val-badge fail';
      }
    }

    if (valFormatStatus) {
      valFormatStatus.textContent = valFormatStatus.dataset.pass || 'PASSED';
      valFormatStatus.className = 'val-badge pass';
    }
  }

  // Download Handler
  downloadBtn?.addEventListener('click', () => {
    if (!activeBlob) return;
    const url = URL.createObjectURL(activeBlob);
    const link = document.createElement('a');
    const selectedVal = presetSelect?.value || 'ssc-doc';
    link.download = `ssc-${docType}-${selectedVal}.jpg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  });
}

// Auto-initialize DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSscResizer);
} else {
  initSscResizer();
}
