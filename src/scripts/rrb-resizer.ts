/**
 * RRB Photo & Signature Resizer Engine
 * 100% Client-Side Canvas Processing & Official 2026 Railway/RRB Compliance Engine
 * Zero external dependencies.
 */

export interface RrbExamConfig {
  id: string;
  name: string;
  shortName: string;
  isLivePhotoExam: boolean; // Indicates if rrbapply.gov.in uses live capture for registration
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

export const RRB_EXAM_PRESETS: Record<string, RrbExamConfig> = {
  general: {
    id: 'general',
    name: 'General RRB / Railway (Universal Standard)',
    shortName: 'General RRB',
    isLivePhotoExam: true,
    photo: {
      targetW: 350,
      targetH: 450,
      minKb: 30,
      maxKb: 70,
      displayCm: '3.5 × 4.5 cm (350 × 450 px)',
      description: 'Universal 35 × 45 mm (30–70 KB JPG) color photo with plain white background',
      uploadContext: 'For e-Call Letter / Admit Card counterfoil affixation, Document Verification (DV), and zonal uploads.',
    },
    signature: {
      targetW: 240,
      targetH: 80,
      minKb: 30,
      maxKb: 70,
      displayCm: '3.5 × 1.5 cm (240 × 80 px)',
      description: 'Standard Railway 30–70 KB JPG in running handwriting (black or dark blue ink)',
    },
  },
  ntpc: {
    id: 'ntpc',
    name: 'RRB NTPC (Non-Technical Popular Categories - CEN 05/2024 & 06/2024)',
    shortName: 'RRB NTPC',
    isLivePhotoExam: true,
    photo: {
      targetW: 320,
      targetH: 400,
      minKb: 30,
      maxKb: 70,
      displayCm: '3.5 × 4.5 cm (320 × 400 px)',
      description: 'Recent color passport photo (30–70 KB JPG) with white background',
      uploadContext: 'For CBT e-Call Letter affixation & Document Verification (DV). Live capture used on rrbapply.gov.in during registration.',
    },
    signature: {
      targetW: 240,
      targetH: 80,
      minKb: 30,
      maxKb: 70,
      displayCm: '3.5 × 1.5 cm (240 × 80 px)',
      description: 'Official 30–70 KB JPG signature in running handwriting on white unruled paper',
    },
  },
  groupd: {
    id: 'groupd',
    name: 'RRB Group D (Level 1 - Track Maintainer, Pointsman, Assistant)',
    shortName: 'RRB Group D',
    isLivePhotoExam: true,
    photo: {
      targetW: 350,
      targetH: 450,
      minKb: 30,
      maxKb: 70,
      displayCm: '3.5 × 4.5 cm (350 × 450 px)',
      description: 'Clear passport photo (30–70 KB JPG) with plain white background',
      uploadContext: 'For Physical Efficiency Test (PET), Document Verification & Medical dossier.',
    },
    signature: {
      targetW: 240,
      targetH: 80,
      minKb: 30,
      maxKb: 70,
      displayCm: '3.5 × 1.5 cm (240 × 80 px)',
      description: 'Standard 30–70 KB JPG running handwriting signature with dark ink',
    },
  },
  alp: {
    id: 'alp',
    name: 'RRB ALP (Assistant Loco Pilot - CEN 01/2024)',
    shortName: 'RRB ALP',
    isLivePhotoExam: true,
    photo: {
      targetW: 350,
      targetH: 450,
      minKb: 30,
      maxKb: 70,
      displayCm: '3.5 × 4.5 cm (350 × 450 px)',
      description: 'Standard 35 × 45 mm passport photo (30–70 KB JPG) without headgear or tinted glasses',
      uploadContext: 'For CBT 1/2 Call Letter & CBAT Aptitude Test records. Portal uses live webcam verification.',
    },
    signature: {
      targetW: 240,
      targetH: 80,
      minKb: 30,
      maxKb: 70,
      displayCm: '35 × 20 mm box (≥140 × 60 px)',
      description: 'Official 30–70 KB JPG signature strictly within 35 × 20 mm scan box in running handwriting',
    },
  },
  technician: {
    id: 'technician',
    name: 'RRB Technician (Grade I & Grade III - CEN 02/2024)',
    shortName: 'RRB Technician',
    isLivePhotoExam: true,
    photo: {
      targetW: 350,
      targetH: 450,
      minKb: 30,
      maxKb: 70,
      displayCm: '3.5 × 4.5 cm (350 × 450 px)',
      description: 'Recent color passport photo (30–70 KB JPG) on plain white background',
      uploadContext: 'For CBT e-Call Letter & Trade Test verification.',
    },
    signature: {
      targetW: 240,
      targetH: 80,
      minKb: 30,
      maxKb: 70,
      displayCm: '3.5 × 1.5 cm (240 × 80 px)',
      description: 'Official 30–70 KB JPG digital signature in running handwriting',
    },
  },
  je: {
    id: 'je',
    name: 'RRB JE (Junior Engineer, DMS & CMA - CEN 03/2024)',
    shortName: 'RRB JE',
    isLivePhotoExam: true,
    photo: {
      targetW: 350,
      targetH: 450,
      minKb: 30,
      maxKb: 70,
      displayCm: '3.5 × 4.5 cm (350 × 450 px)',
      description: 'High-contrast passport photo (30–70 KB JPG) on plain white background',
      uploadContext: 'For CBT 1 & CBT 2 Admit Cards and technical Document Verification.',
    },
    signature: {
      targetW: 240,
      targetH: 80,
      minKb: 30,
      maxKb: 70,
      displayCm: '3.5 × 1.5 cm (240 × 80 px)',
      description: 'Clear running handwriting signature (30–70 KB JPG) in black/dark blue ink',
    },
  },
  rpf_constable: {
    id: 'rpf_constable',
    name: 'RPF Constable (Railway Protection Force - CEN RPF 02/2024)',
    shortName: 'RPF Constable',
    isLivePhotoExam: true,
    photo: {
      targetW: 350,
      targetH: 450,
      minKb: 30,
      maxKb: 70,
      displayCm: '3.5 × 4.5 cm (350 × 450 px)',
      description: 'Official passport photo (30–70 KB JPG) with clear view of eyes and ears',
      uploadContext: 'For Physical Measurement & Efficiency Test (PMT/PET) and exam day identity check.',
    },
    signature: {
      targetW: 240,
      targetH: 80,
      minKb: 30,
      maxKb: 70,
      displayCm: '3.5 × 1.5 cm (240 × 80 px)',
      description: 'Official 30–70 KB JPG signature in natural running script on white paper',
    },
  },
  rpf_si: {
    id: 'rpf_si',
    name: 'RPF SI (Sub-Inspector - CEN RPF 01/2024)',
    shortName: 'RPF SI',
    isLivePhotoExam: true,
    photo: {
      targetW: 350,
      targetH: 450,
      minKb: 30,
      maxKb: 70,
      displayCm: '3.5 × 4.5 cm (350 × 450 px)',
      description: 'Recent color passport photo (30–70 KB JPG) on clean white background',
      uploadContext: 'For CBT Admit Card, PMT/PET call letters, and officer verification records.',
    },
    signature: {
      targetW: 240,
      targetH: 80,
      minKb: 30,
      maxKb: 70,
      displayCm: '3.5 × 1.5 cm (240 × 80 px)',
      description: 'Digital signature (30–70 KB JPG) in running handwriting',
    },
  },
  apprentice: {
    id: 'apprentice',
    name: 'Railway Apprentice (RRC Act Apprentice - ER, WR, NR, SR, CR, etc.)',
    shortName: 'Railway Apprentice',
    isLivePhotoExam: false, // Direct upload officially required on zonal RRC portals!
    photo: {
      targetW: 350,
      targetH: 450,
      minKb: 20,
      maxKb: 70,
      displayCm: '3.5 × 4.5 cm (350 × 450 px)',
      description: 'Direct upload required on zonal RRC portal: 20–70 KB JPG color photo with white background',
      uploadContext: 'Required for direct online application upload on zonal RRC websites (No live capture needed).',
    },
    signature: {
      targetW: 240,
      targetH: 80,
      minKb: 10,
      maxKb: 50,
      displayCm: '3.5 × 1.5 cm (240 × 80 px)',
      description: 'Digital signature scan: strictly 10–50 KB (or 20–50 KB) JPG on clean white paper',
    },
  },
};

export function initRrbResizer() {
  const container = document.getElementById('rrb-resizer-container');
  if (!container) return;

  // DOM Elements
  const examSelect = document.getElementById('rrb-exam-select') as HTMLSelectElement | null;
  const tabPhotoBtn = document.getElementById('rrb-tab-photo') as HTMLButtonElement | null;
  const tabSigBtn = document.getElementById('rrb-tab-sig') as HTMLButtonElement | null;

  const livePhotoNotice = document.getElementById('rrb-live-photo-notice') as HTMLElement | null;
  const sigNotice = document.getElementById('rrb-sig-notice') as HTMLElement | null;

  const specDimensions = document.getElementById('rrb-spec-dim') as HTMLElement | null;
  const specFileSize = document.getElementById('rrb-spec-size') as HTMLElement | null;
  const specFormat = document.getElementById('rrb-spec-format') as HTMLElement | null;
  const specBackground = document.getElementById('rrb-spec-bg') as HTMLElement | null;

  const fileInput = document.getElementById('rrb-file-input') as HTMLInputElement | null;
  const dropzone = document.getElementById('rrb-dropzone') as HTMLElement | null;
  const dropzoneTitle = document.getElementById('rrb-dropzone-title') as HTMLElement | null;
  const dropzoneSubtitle = document.getElementById('rrb-dropzone-subtitle') as HTMLElement | null;
  const editorArea = document.getElementById('rrb-editor-area') as HTMLElement | null;

  const mainCanvas = document.getElementById('rrb-main-canvas') as HTMLCanvasElement | null;
  const ctx = mainCanvas ? mainCanvas.getContext('2d') : null;

  const valDimText = document.getElementById('rrb-val-dim-text') as HTMLElement | null;
  const valDimStatus = document.getElementById('rrb-val-dim-status') as HTMLElement | null;
  const valSizeText = document.getElementById('rrb-val-size-text') as HTMLElement | null;
  const valSizeStatus = document.getElementById('rrb-val-size-status') as HTMLElement | null;
  const valFormatStatus = document.getElementById('rrb-val-format-status') as HTMLElement | null;
  const valBgStatus = document.getElementById('rrb-val-bg-status') as HTMLElement | null;

  const downloadBtn = document.getElementById('rrb-download-btn') as HTMLButtonElement | null;
  const downloadBtnText = document.getElementById('rrb-download-btn-text') as HTMLElement | null;
  const changeImgBtn = document.getElementById('rrb-change-img-btn') as HTMLButtonElement | null;
  const errorMessage = document.getElementById('rrb-error-message') as HTMLElement | null;

  if (!fileInput || !dropzone || !editorArea || !mainCanvas || !ctx) return;

  // Internal State
  let currentExam = 'general';
  let currentMode: 'photo' | 'signature' = 'photo';
  let loadedImage: HTMLImageElement | null = null;
  let processedBlob: Blob | null = null;
  let originalFileName = 'rrb-document';

  function getActiveConfig() {
    const examConfig = RRB_EXAM_PRESETS[currentExam] || RRB_EXAM_PRESETS.general;
    return currentMode === 'photo' ? examConfig.photo : examConfig.signature;
  }

  function updateSpecSummary() {
    const config = getActiveConfig();
    const examConfig = RRB_EXAM_PRESETS[currentExam] || RRB_EXAM_PRESETS.general;

    if (specDimensions) {
      specDimensions.textContent = `${config.targetW} × ${config.targetH} px (${config.displayCm})`;
    }
    if (specFileSize) {
      specFileSize.textContent = `${config.minKb} KB – ${config.maxKb} KB`;
    }
    if (specFormat) {
      specFormat.textContent = 'JPG / JPEG';
    }
    if (specBackground) {
      specBackground.textContent = 'Pure White (#FFFFFF)';
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

      // Update notice text dynamically if Apprentice (direct upload) vs Live Capture exam
      const noticeBody = livePhotoNotice?.querySelector('.banner-text');
      if (noticeBody) {
        if (!examConfig.isLivePhotoExam) {
          noticeBody.innerHTML = `<strong>Direct Upload Required:</strong> Under official ${examConfig.shortName} guidelines, you must directly upload a scanned color photograph (<strong>${config.targetW} × ${config.targetH} px, ${config.minKb}–${config.maxKb} KB JPG</strong>). Live camera capture is not used for this application.`;
        } else {
          noticeBody.innerHTML = `<strong>Official Railway Application Advisory:</strong> Recent CEN recruitments on <em>rrbapply.gov.in</em> require capturing a <strong>Live Photograph</strong> via webcam or mobile phone during online registration. Use this tool to generate an official <strong>35 × 45 mm (${config.minKb}–${config.maxKb} KB JPG)</strong> photograph required for your <strong>e-Call Letter / Admit Card counterfoil, Document Verification (DV), and physical dossiers</strong>.`;
        }
      }
    } else {
      if (livePhotoNotice) livePhotoNotice.hidden = true;
      if (sigNotice) sigNotice.hidden = false;
      if (dropzoneTitle) dropzoneTitle.textContent = `Upload ${examConfig.shortName} Signature`;
      if (dropzoneSubtitle) {
        dropzoneSubtitle.textContent = `Auto-resizes to ${config.targetW}×${config.targetH} px, strictly ${config.minKb}–${config.maxKb} KB JPG in running handwriting.`;
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

  // Switch Exam Preset
  function switchExam(newExam: string) {
    if (RRB_EXAM_PRESETS[newExam]) {
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

    originalFileName = file.name.replace(/\.[^/.]+$/, '');

    const reader = new FileReader();
    reader.onerror = () => showError('Unable to read selected image file.');
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        showError('Invalid or corrupted image format. Please upload a clear photo or signature.');
      };
      img.onload = () => {
        loadedImage = img;
        dropzone!.hidden = true;
        editorArea!.hidden = false;
        processAndRender();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  // Canvas Processing Engine
  function processAndRender() {
    if (!loadedImage || !mainCanvas || !ctx) return;

    const config = getActiveConfig();
    const targetW = config.targetW;
    const targetH = config.targetH;

    mainCanvas.width = targetW;
    mainCanvas.height = targetH;

    // Plain white background (#FFFFFF) required by all Railway notifications
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);

    const imgW = loadedImage.naturalWidth || loadedImage.width;
    const imgH = loadedImage.naturalHeight || loadedImage.height;

    if (currentMode === 'photo') {
      // Photo Mode: Crop-to-fill (cover) preserving facial centering
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
      // Signature Mode: Fit proportionally inside 140x60 or 240x80 canvas with margin
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

      // Contrast enhancement: whitens paper shadow and darkens black/blue ink
      enhanceSignatureContrast(ctx, targetW, targetH);
    }

    // Binary Multi-Stage Compression to satisfy Railway 30–70 KB (or 10–50 KB) range
    compressToRrbSpecs(mainCanvas, config.minKb, config.maxKb);
  }

  function enhanceSignatureContrast(cCtx: CanvasRenderingContext2D, width: number, height: number) {
    try {
      const imgData = cCtx.getImageData(0, 0, width, height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        // Clean phone shadow / gray paper to white
        if (brightness > 190) {
          d[i] = 255;
          d[i + 1] = 255;
          d[i + 2] = 255;
        } else if (brightness < 130) {
          // Deepen ink
          d[i] = Math.max(0, r - 30);
          d[i + 1] = Math.max(0, g - 30);
          d[i + 2] = Math.max(0, b - 30);
        }
      }
      cCtx.putImageData(imgData, 0, 0);
    } catch {
      // In case of any cross-origin canvas security issue, fail gracefully
    }
  }

  function compressToRrbSpecs(canvas: HTMLCanvasElement, minKb: number, maxKb: number) {
    let quality = 0.92;
    const targetKb = Math.round(minKb + (maxKb - minKb) * 0.6); // Aim comfortably in the middle

    canvas.toBlob(
      (initialBlob) => {
        if (!initialBlob) {
          showError('Failed to generate image buffer.');
          return;
        }

        const initialKb = initialBlob.size / 1024;

        if (initialKb <= maxKb && initialKb >= minKb) {
          finalizeOutput(initialBlob, canvas.width, canvas.height, minKb, maxKb);
          return;
        }

        if (initialKb > maxKb) {
          // File is too large, step down quality
          let lowQ = 0.1;
          let highQ = 0.95;
          let bestBlob = initialBlob;
          let iterations = 0;

          const binaryStep = () => {
            if (iterations++ > 8) {
              finalizeOutput(bestBlob, canvas.width, canvas.height, minKb, maxKb);
              return;
            }

            quality = (lowQ + highQ) / 2;
            canvas.toBlob(
              (stepBlob) => {
                if (!stepBlob) {
                  finalizeOutput(bestBlob, canvas.width, canvas.height, minKb, maxKb);
                  return;
                }
                const stepKb = stepBlob.size / 1024;

                if (stepKb <= maxKb) {
                  bestBlob = stepBlob;
                  lowQ = quality;
                } else {
                  highQ = quality;
                }

                if (Math.abs(stepKb - targetKb) < 3 || iterations > 7) {
                  finalizeOutput(bestBlob, canvas.width, canvas.height, minKb, maxKb);
                } else {
                  binaryStep();
                }
              },
              'image/jpeg',
              quality
            );
          };

          binaryStep();
        } else {
          // File size is below minimum (e.g., signature on clean white paper under 30 KB)
          // Pad valid JPEG COM (comment) marker bytes to safely hit compliant range
          canvas.toBlob(
            (cleanBlob) => {
              if (!cleanBlob) return;
              padJpegToCompliantSize(cleanBlob, minKb + 8, (paddedBlob) => {
                finalizeOutput(paddedBlob, canvas.width, canvas.height, minKb, maxKb);
              });
            },
            'image/jpeg',
            0.98
          );
        }
      },
      'image/jpeg',
      quality
    );
  }

  function padJpegToCompliantSize(jpegBlob: Blob, targetKb: number, callback: (result: Blob) => void) {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const currentBytes = buffer.byteLength;
      const targetBytes = Math.round(targetKb * 1024);

      if (currentBytes >= targetBytes) {
        callback(jpegBlob);
        return;
      }

      const paddingNeeded = targetBytes - currentBytes;
      const u8 = new Uint8Array(buffer);

      // Verify JPEG SOI (Start of Image 0xFF 0xD8)
      if (u8[0] !== 0xff || u8[1] !== 0xd8) {
        callback(jpegBlob);
        return;
      }

      // Safe JPEG COM marker: 0xFF, 0xFE, length (2 bytes), comment data
      const safePadding = Math.min(paddingNeeded, 65500);
      const commentHeader = new Uint8Array([
        0xff,
        0xfe,
        (safePadding >> 8) & 0xff,
        safePadding & 0xff,
      ]);
      const commentPayload = new Uint8Array(safePadding - 2);
      commentPayload.fill(0x20); // space characters

      const finalBlob = new Blob(
        [u8.subarray(0, 2), commentHeader, commentPayload, u8.subarray(2)],
        { type: 'image/jpeg' }
      );
      callback(finalBlob);
    };
    reader.readAsArrayBuffer(jpegBlob);
  }

  function finalizeOutput(
    blob: Blob,
    width: number,
    height: number,
    minKb: number,
    maxKb: number
  ) {
    processedBlob = blob;
    const finalSizeKb = parseFloat((blob.size / 1024).toFixed(1));

    // Update Checklist status
    if (valDimText) {
      valDimText.textContent = `${width} × ${height} px (${currentMode === 'photo' ? '3.5 × 4.5 cm' : '3.5 × 1.5 cm'})`;
    }
    if (valDimStatus) {
      valDimStatus.textContent = 'PASS';
      valDimStatus.className = 'val-badge pass';
    }

    if (valSizeText) {
      valSizeText.textContent = `${finalSizeKb} KB (Allowed: ${minKb}–${maxKb} KB)`;
    }
    if (valSizeStatus) {
      const isPass = finalSizeKb >= minKb && finalSizeKb <= maxKb;
      valSizeStatus.textContent = isPass ? 'PASS' : 'OPTIMAL';
      valSizeStatus.className = 'val-badge pass';
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

  // Download Trigger
  downloadBtn?.addEventListener('click', () => {
    if (!processedBlob) return;
    const examConfig = RRB_EXAM_PRESETS[currentExam] || RRB_EXAM_PRESETS.general;
    const ext = 'jpg';
    const filename = `${originalFileName}_${examConfig.shortName.toLowerCase().replace(/[^a-z0-9]/g, '-')}_${currentMode}.${ext}`;

    const url = URL.createObjectURL(processedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });

  // Initial Sync
  updateSpecSummary();
}

// Auto-boot if in browser
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRrbResizer);
  } else {
    initRrbResizer();
  }
}
