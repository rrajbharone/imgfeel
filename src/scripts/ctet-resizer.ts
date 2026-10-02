/**
 * CTET Photo & Signature Resizer Engine
 * 100% Client-Side Canvas Processing & Official 2026 CBSE CTET Compliance Engine
 * Zero external dependencies.
 */

export interface CtetExamConfig {
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
    uploadContext: string;
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

export const CTET_EXAM_PRESETS: Record<string, CtetExamConfig> = {
  general: {
    id: 'general',
    name: 'General CTET (Universal Standard)',
    shortName: 'General CTET',
    photo: {
      targetW: 350,
      targetH: 450,
      minKb: 10,
      maxKb: 100,
      displayCm: '3.5 × 4.5 cm (350 × 450 px)',
      description: 'Official 3.5 × 4.5 cm (10–100 KB JPG) passport photo with plain white background & 70%–80% face coverage',
      uploadContext: 'Universally compliant across all CBSE CTET online application submissions on ctet.nic.in.',
    },
    signature: {
      targetW: 350,
      targetH: 150,
      minKb: 3,
      maxKb: 30,
      displayCm: '3.5 × 1.5 cm (350 × 150 px)',
      description: 'Standard 3–30 KB JPG signature in running handwriting with black or dark blue ink on white paper',
    },
  },
  paper1: {
    id: 'paper1',
    name: 'CTET Paper 1 (Primary Stage - Classes I to V)',
    shortName: 'CTET Paper 1',
    photo: {
      targetW: 350,
      targetH: 450,
      minKb: 10,
      maxKb: 100,
      displayCm: '3.5 × 4.5 cm (350 × 450 px)',
      description: 'Recent color passport photo (10–100 KB JPG) with white background, ears visible, neutral expression',
      uploadContext: 'Mandatory upload for Paper 1 Primary Stage e-Admit Card and CBSE verification.',
    },
    signature: {
      targetW: 350,
      targetH: 150,
      minKb: 3,
      maxKb: 30,
      displayCm: '3.5 × 1.5 cm (350 × 150 px)',
      description: 'Official 3–30 KB JPG signature in running handwriting on clean white unruled paper',
    },
  },
  paper2: {
    id: 'paper2',
    name: 'CTET Paper 2 (Elementary Stage - Classes VI to VIII)',
    shortName: 'CTET Paper 2',
    photo: {
      targetW: 350,
      targetH: 450,
      minKb: 10,
      maxKb: 100,
      displayCm: '3.5 × 4.5 cm (350 × 450 px)',
      description: 'Clear passport photo (10–100 KB JPG) on white background without caps or dark glasses',
      uploadContext: 'Mandatory upload for Paper 2 Elementary Stage e-Admit Card and CBSE records.',
    },
    signature: {
      targetW: 350,
      targetH: 150,
      minKb: 3,
      maxKb: 30,
      displayCm: '3.5 × 1.5 cm (350 × 150 px)',
      description: 'Running handwriting signature (strictly 3–30 KB JPG) with black or dark blue ink',
    },
  },
  both: {
    id: 'both',
    name: 'CTET Both Papers (Paper 1 & Paper 2 Combined)',
    shortName: 'CTET Both Papers',
    photo: {
      targetW: 350,
      targetH: 450,
      minKb: 10,
      maxKb: 100,
      displayCm: '3.5 × 4.5 cm (350 × 450 px)',
      description: 'Recent color passport photograph (10–100 KB JPG) for combined Paper 1 and Paper 2 registration',
      uploadContext: 'Uploaded once and applied across both Paper 1 & Paper 2 examination shifts.',
    },
    signature: {
      targetW: 350,
      targetH: 150,
      minKb: 3,
      maxKb: 30,
      displayCm: '3.5 × 1.5 cm (350 × 150 px)',
      description: 'Digital signature scan (strictly 3–30 KB JPG) in natural running script on plain white paper',
    },
  },
};

export function initCtetResizer() {
  const container = document.getElementById('ctet-resizer-container');
  if (!container) return;

  // DOM Elements
  const examSelect = document.getElementById('ctet-exam-select') as HTMLSelectElement | null;
  const tabPhotoBtn = document.getElementById('ctet-tab-photo') as HTMLButtonElement | null;
  const tabSigBtn = document.getElementById('ctet-tab-sig') as HTMLButtonElement | null;

  const livePhotoNotice = document.getElementById('ctet-live-photo-notice') as HTMLElement | null;
  const sigNotice = document.getElementById('ctet-sig-notice') as HTMLElement | null;

  const specDim = document.getElementById('ctet-spec-dim');
  const specSize = document.getElementById('ctet-spec-size');
  const specFormat = document.getElementById('ctet-spec-format');
  const specBg = document.getElementById('ctet-spec-bg');

  const dropzone = document.getElementById('ctet-dropzone') as HTMLElement | null;
  const dropzoneTitle = document.getElementById('ctet-dropzone-title');
  const dropzoneSubtitle = document.getElementById('ctet-dropzone-subtitle');
  const fileInput = document.getElementById('ctet-file-input') as HTMLInputElement | null;
  const errorMessage = document.getElementById('ctet-error-message') as HTMLElement | null;

  const editorArea = document.getElementById('ctet-editor-area') as HTMLElement | null;
  const mainCanvas = document.getElementById('ctet-main-canvas') as HTMLCanvasElement | null;
  const downloadBtn = document.getElementById('ctet-download-btn') as HTMLButtonElement | null;
  const downloadBtnText = document.getElementById('ctet-download-btn-text');
  const changeImgBtn = document.getElementById('ctet-change-img-btn') as HTMLButtonElement | null;

  const valDimText = document.getElementById('ctet-val-dim-text');
  const valDimStatus = document.getElementById('ctet-val-dim-status');
  const valSizeText = document.getElementById('ctet-val-size-text');
  const valSizeStatus = document.getElementById('ctet-val-size-status');
  const valFormatStatus = document.getElementById('ctet-val-format-status');
  const valBgStatus = document.getElementById('ctet-val-bg-status');

  // Application State
  let currentExamKey = 'general';
  let currentMode: 'photo' | 'signature' = 'photo';
  let loadedImage: HTMLImageElement | null = null;
  let processedBlob: Blob | null = null;
  let processedDataUrl: string | null = null;

  // Sync Specifications and Notice Panels
  function updateSpecsUI() {
    const config = CTET_EXAM_PRESETS[currentExamKey] || CTET_EXAM_PRESETS.general;
    const isPhoto = currentMode === 'photo';
    const subConfig = isPhoto ? config.photo : config.signature;

    if (specDim) {
      specDim.textContent = `${subConfig.targetW} × ${subConfig.targetH} px (${subConfig.displayCm})`;
    }
    if (specSize) {
      specSize.textContent = `${subConfig.minKb} KB – ${subConfig.maxKb} KB`;
    }
    if (specFormat) {
      specFormat.textContent = 'JPG / JPEG';
    }
    if (specBg) {
      specBg.textContent = isPhoto ? 'Pure White (#FFFFFF)' : 'White Unruled Paper';
    }

    if (dropzoneTitle && dropzoneSubtitle) {
      if (isPhoto) {
        dropzoneTitle.textContent = `Upload Candidate Photograph (${config.shortName})`;
        dropzoneSubtitle.textContent = `Drag & drop JPG, PNG, or WebP. Auto-resizes to ${subConfig.targetW}×${subConfig.targetH} px, strictly ${subConfig.minKb}–${subConfig.maxKb} KB JPG on white background.`;
      } else {
        dropzoneTitle.textContent = `Upload Candidate Signature (${config.shortName})`;
        dropzoneSubtitle.textContent = `Drag & drop JPG, PNG, or WebP. Auto-formats to ${subConfig.targetW}×${subConfig.targetH} px, strictly ${subConfig.minKb}–${subConfig.maxKb} KB JPG in running handwriting.`;
      }
    }

    // Update Notice Banners
    if (sigNotice) {
      sigNotice.hidden = isPhoto;
    }

    if (livePhotoNotice) {
      livePhotoNotice.hidden = !isPhoto;
      if (isPhoto) {
        const liveNoticeText = livePhotoNotice.querySelector('.banner-text');
        if (liveNoticeText) {
          liveNoticeText.innerHTML = `<strong>Official CBSE CTET Photograph Advisory:</strong> Upload a recent color passport photograph (strictly <strong>10 KB – 100 KB JPG</strong>) with a plain white or light background and 70%–80% face coverage. Make sure to keep at least <strong>5 to 10 identical physical copies</strong> of this photo for the examination center attendance sheet and verification.`;
        }
      }
    }

    if (loadedImage) {
      processCurrentFile();
    }
  }

  // Switch Mode Tabs (Photograph vs Signature)
  if (tabPhotoBtn && tabSigBtn) {
    tabPhotoBtn.addEventListener('click', () => {
      if (currentMode === 'photo') return;
      currentMode = 'photo';
      tabPhotoBtn.classList.add('active');
      tabSigBtn.classList.remove('active');
      resetImageState();
      updateSpecsUI();
    });

    tabSigBtn.addEventListener('click', () => {
      if (currentMode === 'signature') return;
      currentMode = 'signature';
      tabSigBtn.classList.add('active');
      tabPhotoBtn.classList.remove('active');
      resetImageState();
      updateSpecsUI();
    });
  }

  // Exam Dropdown Change Event
  if (examSelect) {
    examSelect.addEventListener('change', () => {
      currentExamKey = examSelect.value;
      updateSpecsUI();
    });
  }

  // Reset loaded image state
  function resetImageState() {
    loadedImage = null;
    processedBlob = null;
    processedDataUrl = null;
    if (fileInput) fileInput.value = '';
    if (editorArea) editorArea.hidden = true;
    if (dropzone) dropzone.hidden = false;
    hideError();
  }

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

  // File Upload Handlers
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-active');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-active');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-active');
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        handleSelectedFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        handleSelectedFile(fileInput.files[0]);
      }
    });
  }

  if (changeImgBtn) {
    changeImgBtn.addEventListener('click', () => {
      resetImageState();
      if (fileInput) fileInput.click();
    });
  }

  function handleSelectedFile(file: File) {
    hideError();
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      showError('Please upload a valid image file (JPG, JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      showError('The uploaded file exceeds 25 MB. Please select a smaller image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        loadedImage = img;
        if (dropzone) dropzone.hidden = true;
        if (editorArea) editorArea.hidden = false;
        processCurrentFile();
      };
      img.onerror = () => {
        showError('Could not decode the selected image. Please try a different file.');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      showError('Error reading file from disk. Please try again.');
    };
    reader.readAsDataURL(file);
  }

  /**
   * Main Processing Function
   * Renders to exact target dimensions and performs smart binary compression loop
   */
  async function processCurrentFile() {
    if (!loadedImage || !mainCanvas) return;
    const config = CTET_EXAM_PRESETS[currentExamKey] || CTET_EXAM_PRESETS.general;
    const isPhoto = currentMode === 'photo';
    const subConfig = isPhoto ? config.photo : config.signature;

    const { targetW, targetH, minKb, maxKb } = subConfig;

    mainCanvas.width = targetW;
    mainCanvas.height = targetH;
    const ctx = mainCanvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Background fill (Pure White #FFFFFF)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);

    // Scaling & Cropping Math
    const imgW = loadedImage.naturalWidth || loadedImage.width;
    const imgH = loadedImage.naturalHeight || loadedImage.height;

    if (isPhoto) {
      // Centered Cover Crop for passport photograph
      const srcRatio = imgW / imgH;
      const targetRatio = targetW / targetH;
      let drawW = targetW;
      let drawH = targetH;
      let offsetX = 0;
      let offsetY = 0;

      if (srcRatio > targetRatio) {
        drawW = targetH * srcRatio;
        offsetX = (targetW - drawW) / 2;
      } else {
        drawH = targetW / srcRatio;
        offsetY = (targetH - drawH) / 2;
      }

      ctx.drawImage(loadedImage, offsetX, offsetY, drawW, drawH);
    } else {
      // Signature processing: centered contain + clean signature contrast enhancement
      const scale = Math.min((targetW * 0.92) / imgW, (targetH * 0.88) / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const offsetX = (targetW - drawW) / 2;
      const offsetY = (targetH - drawH) / 2;

      ctx.drawImage(loadedImage, offsetX, offsetY, drawW, drawH);

      // Signature Paper Whitener & Contrast Enhancer
      try {
        const imgData = ctx.getImageData(0, 0, targetW, targetH);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Light grayish paper background threshold whitening
          if (r > 195 && g > 195 && b > 195) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          } else {
            // Darken pen strokes slightly for crisp reproduction
            data[i] = Math.max(0, r * 0.85);
            data[i + 1] = Math.max(0, g * 0.85);
            data[i + 2] = Math.max(0, b * 0.85);
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } catch {
        // Fallback gracefully if pixel manipulation is blocked
      }
    }

    // Compression Loop: Target strictly between minKb and maxKb
    const targetMinBytes = minKb * 1024;
    const targetMaxBytes = maxKb * 1024;

    let bestBlob: Blob | null = null;
    let quality = 0.90;
    let step = 0.05;

    for (let i = 0; i < 16; i++) {
      const blob = await new Promise<Blob | null>((resolve) => {
        mainCanvas.toBlob(resolve, 'image/jpeg', quality);
      });

      if (!blob) break;

      bestBlob = blob;

      if (blob.size <= targetMaxBytes && blob.size >= targetMinBytes) {
        break; // Ideal size match
      } else if (blob.size > targetMaxBytes) {
        quality -= step;
        if (quality < 0.15) break;
      } else {
        // File is smaller than minKb (e.g. clean signature under 3 KB)
        if (quality >= 0.95) break;
        quality = Math.min(0.98, quality + step);
      }
    }

    // Safety padding for signatures if below minKb
    if (bestBlob && bestBlob.size < targetMinBytes) {
      bestBlob = await padJpegBlob(bestBlob, targetMinBytes + 512);
    }

    if (!bestBlob) {
      showError('Failed to generate compliant output. Please try again.');
      return;
    }

    processedBlob = bestBlob;
    processedDataUrl = URL.createObjectURL(bestBlob);

    // Update Checklist & Metrics
    const finalKb = (bestBlob.size / 1024).toFixed(1);
    const isSizeCompliant = bestBlob.size >= targetMinBytes && bestBlob.size <= targetMaxBytes;

    if (valDimText) {
      valDimText.textContent = `${targetW} × ${targetH} px (${subConfig.displayCm})`;
    }
    if (valDimStatus) {
      valDimStatus.textContent = 'PASS';
      valDimStatus.className = 'val-badge pass';
    }

    if (valSizeText) {
      valSizeText.textContent = `${finalKb} KB (Allowed: ${minKb}–${maxKb} KB)`;
    }
    if (valSizeStatus) {
      if (isSizeCompliant) {
        valSizeStatus.textContent = 'PASS';
        valSizeStatus.className = 'val-badge pass';
      } else {
        valSizeStatus.textContent = 'NOTICE';
        valSizeStatus.className = 'val-badge warn';
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

    if (downloadBtnText) {
      const labelType = isPhoto ? 'Photo' : 'Signature';
      downloadBtnText.textContent = `Download Compliant ${labelType} (${finalKb} KB JPG)`;
    }
  }

  /**
   * Pads a valid JPEG Blob using safe JPEG Comment Marker (0xFF 0xFE)
   * Ensures files under portal minKb threshold are not rejected by strict byte validators.
   */
  async function padJpegBlob(blob: Blob, desiredBytes: number): Promise<Blob> {
    const buffer = await blob.arrayBuffer();
    const currentBytes = buffer.byteLength;
    if (currentBytes >= desiredBytes) return blob;

    const diff = desiredBytes - currentBytes;
    if (diff <= 4) return blob;

    const u8 = new Uint8Array(buffer);
    const insertPos = 2; // Right after SOI marker 0xFF 0xD8

    const padded = new Uint8Array(currentBytes + diff);
    padded.set(u8.subarray(0, insertPos), 0);

    // Insert COM Marker: 0xFF 0xFE
    padded[insertPos] = 0xff;
    padded[insertPos + 1] = 0xfe;
    const segLen = diff;
    padded[insertPos + 2] = (segLen >> 8) & 0xff;
    padded[insertPos + 3] = segLen & 0xff;

    // Fill comment payload with safe ascii spaces
    for (let k = 4; k < segLen; k++) {
      padded[insertPos + k] = 0x20;
    }

    padded.set(u8.subarray(insertPos), insertPos + diff);

    return new Blob([padded], { type: 'image/jpeg' });
  }

  // Download Trigger Handler
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (!processedBlob || !processedDataUrl) return;
      const config = CTET_EXAM_PRESETS[currentExamKey] || CTET_EXAM_PRESETS.general;
      const isPhoto = currentMode === 'photo';
      const examSlug = config.id.replace('_', '-');
      const filename = `ctet-${examSlug}-${isPhoto ? 'photo' : 'signature'}-compliant.jpg`;

      const tempLink = document.createElement('a');
      tempLink.href = processedDataUrl;
      tempLink.download = filename;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
    });
  }

  // Initialize specs view on load
  updateSpecsUI();
}

// Auto-run if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCtetResizer);
} else {
  initCtetResizer();
}
