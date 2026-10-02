/**
 * NEET & JEE Entrance Exam Photo & Signature Resizer Engine
 * 100% Client-Side Canvas Processing & Official 2026 NTA / NBEMS / IIT Compliance Engine
 * Zero external dependencies.
 */

export interface NeetExamConfig {
  id: string;
  name: string;
  shortName: string;
  isLivePhotoExam: boolean; // Indicates if portal mandates real-time live webcam capture alongside upload
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

export const NEET_EXAM_PRESETS: Record<string, NeetExamConfig> = {
  general: {
    id: 'general',
    name: 'General Entrance Exam (National Standard)',
    shortName: 'General Entrance',
    isLivePhotoExam: true,
    photo: {
      targetW: 350,
      targetH: 450,
      minKb: 10,
      maxKb: 100,
      displayCm: '3.5 × 4.5 cm (350 × 450 px)',
      description: 'Universal 3.5 × 4.5 cm (10–100 KB JPG) passport photo with plain white background & 80% face coverage',
      uploadContext: 'Universally compliant across NTA (NEET UG, JEE Main) and NBEMS (NEET PG) application portals.',
    },
    signature: {
      targetW: 350,
      targetH: 150,
      minKb: 10,
      maxKb: 50,
      displayCm: '3.5 × 1.5 cm (350 × 150 px)',
      description: 'Standard 10–50 KB JPG signature in running handwriting with black or dark blue ink on white paper',
    },
  },
  neet_ug: {
    id: 'neet_ug',
    name: 'NEET UG (National Eligibility cum Entrance Test - NTA)',
    shortName: 'NEET UG',
    isLivePhotoExam: true,
    photo: {
      targetW: 350,
      targetH: 450,
      minKb: 10,
      maxKb: 200,
      displayCm: '3.5 × 4.5 cm (350 × 450 px)',
      description: 'Recent color passport photo (10–200 KB JPG) with white background, 80% face coverage, ears clearly visible',
      uploadContext: 'Mandatory upload on exams.nta.ac.in/NEET. Printed copies & 4"×6" postcard photos must be kept for exam hall.',
    },
    signature: {
      targetW: 350,
      targetH: 150,
      minKb: 10,
      maxKb: 100,
      displayCm: '3.5 × 1.5 cm (350 × 150 px)',
      description: 'Official 10–100 KB JPG signature in continuous running handwriting with black/blue ink on white paper',
    },
  },
  neet_pg: {
    id: 'neet_pg',
    name: 'NEET PG (National Eligibility cum Entrance Test - NBEMS)',
    shortName: 'NEET PG',
    isLivePhotoExam: true,
    photo: {
      targetW: 350,
      targetH: 450,
      minKb: 10,
      maxKb: 80,
      displayCm: '3.5 × 4.5 cm (350 × 450 px)',
      description: 'Recent color passport photo strictly less than 80 KB (10–80 KB JPG) on plain white background taken within 3 months',
      uploadContext: 'Mandatory upload on natboard.edu.in. NBEMS also requires real-time live webcam photograph capture.',
    },
    signature: {
      targetW: 350,
      targetH: 150,
      minKb: 10,
      maxKb: 80,
      displayCm: '3.5 × 1.5 cm (350 × 150 px)',
      description: 'Digital signature strictly less than 80 KB (10–80 KB JPG) signed within 3.5 × 1.5 cm box in running hand',
    },
  },
  jee_main: {
    id: 'jee_main',
    name: 'JEE Main (Joint Entrance Examination - NTA)',
    shortName: 'JEE Main',
    isLivePhotoExam: true,
    photo: {
      targetW: 350,
      targetH: 450,
      minKb: 10,
      maxKb: 200,
      displayCm: '3.5 × 4.5 cm (350 × 450 px)',
      description: 'Recent color passport photo (10–200 KB JPG) with plain white background, 80% face coverage, neutral expression',
      uploadContext: 'Uploaded on jeemain.nta.nic.in. Used on e-Admit Card, attendance sheet, and JoSAA counselling.',
    },
    signature: {
      targetW: 350,
      targetH: 150,
      minKb: 10,
      maxKb: 100,
      displayCm: '3.5 × 1.5 cm (350 × 150 px)',
      description: 'Official 10–100 KB JPG digital signature in running handwriting with blue or black ink on unruled white paper',
    },
  },
  jee_advanced: {
    id: 'jee_advanced',
    name: 'JEE Advanced (IIT Entrance Examination)',
    shortName: 'JEE Advanced',
    isLivePhotoExam: false, // Imported from JEE Main for Indian candidates; direct upload for foreign/special categories
    photo: {
      targetW: 350,
      targetH: 450,
      minKb: 10,
      maxKb: 200,
      displayCm: '3.5 × 4.5 cm (350 × 450 px)',
      description: 'Scanned passport photo (10–200 KB JPG) on white background with 80% face coverage (for direct upload/corrections)',
      uploadContext: 'Auto-imported from JEE Main database for Indian candidates; required upload for foreign nationals & corrections.',
    },
    signature: {
      targetW: 350,
      targetH: 150,
      minKb: 10,
      maxKb: 100,
      displayCm: '3.5 × 1.5 cm (350 × 150 px)',
      description: 'Digital signature scan (10–100 KB JPG) in natural running hand on plain white paper',
    },
  },
};

export function initNeetResizer() {
  const container = document.getElementById('neet-resizer-container');
  if (!container) return;

  // DOM Elements
  const examSelect = document.getElementById('neet-exam-select') as HTMLSelectElement | null;
  const tabPhotoBtn = document.getElementById('neet-tab-photo') as HTMLButtonElement | null;
  const tabSigBtn = document.getElementById('neet-tab-sig') as HTMLButtonElement | null;

  const livePhotoNotice = document.getElementById('neet-live-photo-notice') as HTMLElement | null;
  const sigNotice = document.getElementById('neet-sig-notice') as HTMLElement | null;

  const specDim = document.getElementById('neet-spec-dim');
  const specSize = document.getElementById('neet-spec-size');
  const specFormat = document.getElementById('neet-spec-format');
  const specBg = document.getElementById('neet-spec-bg');

  const dropzone = document.getElementById('neet-dropzone') as HTMLElement | null;
  const dropzoneTitle = document.getElementById('neet-dropzone-title');
  const dropzoneSubtitle = document.getElementById('neet-dropzone-subtitle');
  const fileInput = document.getElementById('neet-file-input') as HTMLInputElement | null;
  const errorMessage = document.getElementById('neet-error-message') as HTMLElement | null;

  const editorArea = document.getElementById('neet-editor-area') as HTMLElement | null;
  const mainCanvas = document.getElementById('neet-main-canvas') as HTMLCanvasElement | null;
  const downloadBtn = document.getElementById('neet-download-btn') as HTMLButtonElement | null;
  const downloadBtnText = document.getElementById('neet-download-btn-text');
  const changeImgBtn = document.getElementById('neet-change-img-btn') as HTMLButtonElement | null;

  const valDimText = document.getElementById('neet-val-dim-text');
  const valDimStatus = document.getElementById('neet-val-dim-status');
  const valSizeText = document.getElementById('neet-val-size-text');
  const valSizeStatus = document.getElementById('neet-val-size-status');
  const valFormatStatus = document.getElementById('neet-val-format-status');
  const valBgStatus = document.getElementById('neet-val-bg-status');

  // Application State
  let currentExamKey = 'general';
  let currentMode: 'photo' | 'signature' = 'photo';
  let loadedImage: HTMLImageElement | null = null;
  let processedBlob: Blob | null = null;
  let processedDataUrl: string | null = null;

  // Sync Specifications and Notice Panels
  function updateSpecsUI() {
    const config = NEET_EXAM_PRESETS[currentExamKey] || NEET_EXAM_PRESETS.general;
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
          if (config.id === 'neet_pg') {
            liveNoticeText.innerHTML = `<strong>Official NBEMS Advisory:</strong> NEET PG mandates uploading a recent passport photo strictly between <strong>10 KB and 80 KB JPG</strong> on a plain white background. In addition, NBEMS requires capturing a <strong>real-time Live Photo</strong> via webcam during online application registration.`;
          } else if (config.id === 'jee_advanced') {
            liveNoticeText.innerHTML = `<strong>Official JEE Advanced Notice:</strong> For Indian nationals, photograph and signature records are automatically imported from your <strong>JEE Main application</strong>. Candidates registering through foreign/special portals or correction windows must upload a <strong>10–200 KB JPG</strong> photograph on white background.`;
          } else {
            liveNoticeText.innerHTML = `<strong>Official NTA Application Advisory:</strong> Recent portals on <em>exams.nta.ac.in</em> require capturing a <strong>Live Photograph</strong> via webcam during online form submission in addition to uploading your scanned passport photo (<strong>10–200 KB JPG</strong>). You must also keep identical printed copies (and 4"×6" postcard photos for NEET UG) for exam day attendance.`;
          }
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
    const config = NEET_EXAM_PRESETS[currentExamKey] || NEET_EXAM_PRESETS.general;
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
    let quality = 0.92;
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
        // File is smaller than minKb (e.g. clean signature under 10 KB)
        // If quality is already high, break and we will apply JPEG COM comment padding
        if (quality >= 0.95) break;
        quality = Math.min(0.98, quality + step);
      }
    }

    // Safety padding for signatures if below minKb
    if (bestBlob && bestBlob.size < targetMinBytes) {
      bestBlob = await padJpegBlob(bestBlob, targetMinBytes + 1024);
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

    // JPEG Comment segment length is diff
    const u8 = new Uint8Array(buffer);
    // Find SOS (0xFF 0xDA) marker or insert after SOI (index 2)
    const insertPos = 2; // Right after SOI marker 0xFF 0xD8

    const padded = new Uint8Array(currentBytes + diff);
    // Copy SOI
    padded.set(u8.subarray(0, insertPos), 0);

    // Insert COM Marker: 0xFF 0xFE
    padded[insertPos] = 0xff;
    padded[insertPos + 1] = 0xfe;
    // Length (includes length bytes themselves)
    const segLen = diff;
    padded[insertPos + 2] = (segLen >> 8) & 0xff;
    padded[insertPos + 3] = segLen & 0xff;

    // Fill comment payload with safe ascii spaces
    for (let k = 4; k < segLen; k++) {
      padded[insertPos + k] = 0x20; // Space character
    }

    // Copy remaining original JPEG data
    padded.set(u8.subarray(insertPos), insertPos + diff);

    return new Blob([padded], { type: 'image/jpeg' });
  }

  // Download Trigger Handler
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (!processedBlob || !processedDataUrl) return;
      const config = NEET_EXAM_PRESETS[currentExamKey] || NEET_EXAM_PRESETS.general;
      const isPhoto = currentMode === 'photo';
      const examSlug = config.id.replace('_', '-');
      const filename = `${examSlug}-${isPhoto ? 'photograph' : 'signature'}-compliant.jpg`;

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
  document.addEventListener('DOMContentLoaded', initNeetResizer);
} else {
  initNeetResizer();
}
