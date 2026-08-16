/**
 * Image File Size Checker — Client-Side Analyzer
 * 100% Private, Zero Server Uploads
 */

export interface FileSizeAnalysis {
  fileName: string;
  bytes: number;
  kbDecimal: number;
  mbDecimal: number;
  kibBinary: number;
  mibBinary: number;
  bits: number;
  mimeType: string;
  detectedFormat: string;
  isValidSignature: boolean;
  width: number;
  height: number;
  megapixels: number;
  aspectRatio: string;
  bpp: number;
  webRating: {
    status: 'ultra' | 'good' | 'moderate' | 'heavy' | 'critical';
    label: string;
    description: string;
  };
  loadTimes: {
    fiber100M: string;
    lte4G: string;
    fast3G: string;
    slow3G: string;
    edge2G: string;
  };
  storageLimits: {
    fitsEmail25Mb: boolean;
    count1Gb: number;
    count16Gb: number;
    count64Gb: number;
    count128Gb: number;
  };
}

/** Format numbers with comma separators */
function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Calculate Greatest Common Divisor */
function getGcd(a: number, b: number): number {
  return b === 0 ? a : getGcd(b, a % b);
}

/** Detect binary magic bytes */
async function detectMagicBytes(file: File): Promise<{ detected: string; isValid: boolean }> {
  try {
    const buffer = await file.slice(0, 32).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { detected: 'JPEG / JPG', isValid: true };
    }
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return { detected: 'PNG', isValid: true };
    }
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      return { detected: 'GIF', isValid: true };
    }
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
      const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
      if (isWebp) return { detected: 'WebP', isValid: true };
    }
    if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
      return { detected: 'AVIF / HEIF', isValid: true };
    }
    if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
      return { detected: 'BMP', isValid: true };
    }
    if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) {
      return { detected: 'ICO', isValid: true };
    }
    if ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
        (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a)) {
      return { detected: 'TIFF', isValid: true };
    }

    if (file.type.includes('svg') || file.name.endsWith('.svg')) {
      return { detected: 'SVG (Vector)', isValid: true };
    }

    return { detected: file.type || 'Unknown Image', isValid: true };
  } catch {
    return { detected: file.type || 'Standard Image', isValid: true };
  }
}

/** Calculate download time in seconds or milliseconds */
function calculateTransferTime(bytes: number, speedBps: number): string {
  const seconds = (bytes * 8) / speedBps;
  if (seconds < 0.01) return '< 10 ms';
  if (seconds < 1) return `${Math.round(seconds * 1000)} ms`;
  if (seconds < 60) return `${seconds.toFixed(2)} s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

/** Web Performance Health Score Rating */
function getWebPerformanceRating(bytes: number): {
  status: 'ultra' | 'good' | 'moderate' | 'heavy' | 'critical';
  label: string;
  description: string;
} {
  const kb = bytes / 1000;
  if (kb < 100) {
    return {
      status: 'ultra',
      label: 'Ultra-Fast (<100 KB)',
      description: 'Optimal for lightning-fast web pages, instant mobile loading, and 100/100 Google Core Web Vitals.',
    };
  }
  if (kb <= 300) {
    return {
      status: 'good',
      label: 'Fast (100–300 KB)',
      description: 'Great balance of visual clarity and quick loading for hero banners and featured content.',
    };
  }
  if (kb <= 800) {
    return {
      status: 'moderate',
      label: 'Moderate (300–800 KB)',
      description: 'Acceptable for high-res photography, but compression to WebP or AVIF is recommended.',
    };
  }
  if (kb <= 2048) {
    return {
      status: 'heavy',
      label: 'Heavy (800 KB–2 MB)',
      description: 'May noticeably increase Largest Contentful Paint (LCP) on mobile 3G/4G connections.',
    };
  }
  return {
    status: 'critical',
    label: 'Critical / Very Heavy (>2 MB)',
    description: 'Severe impact on page load speed and bandwidth. Immediate image compression is strongly advised.',
  };
}

/** Main analysis processor */
export async function analyzeImageFileSize(file: File): Promise<FileSizeAnalysis> {
  const bytes = file.size;
  const kbDecimal = bytes / 1000;
  const mbDecimal = bytes / 1000000;
  const kibBinary = bytes / 1024;
  const mibBinary = bytes / (1024 * 1024);
  const bits = bytes * 8;

  const magic = await detectMagicBytes(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        // Fallback for SVG or non-renderable formats
        const analysis: FileSizeAnalysis = {
          fileName: file.name,
          bytes,
          kbDecimal,
          mbDecimal,
          kibBinary,
          mibBinary,
          bits,
          mimeType: file.type || 'image/*',
          detectedFormat: magic.detected,
          isValidSignature: magic.isValid,
          width: 0,
          height: 0,
          megapixels: 0,
          aspectRatio: 'Vector / Scalable',
          bpp: 0,
          webRating: getWebPerformanceRating(bytes),
          loadTimes: {
            fiber100M: calculateTransferTime(bytes, 100_000_000),
            lte4G: calculateTransferTime(bytes, 25_000_000),
            fast3G: calculateTransferTime(bytes, 1_600_000),
            slow3G: calculateTransferTime(bytes, 400_000),
            edge2G: calculateTransferTime(bytes, 50_000),
          },
          storageLimits: {
            fitsEmail25Mb: bytes <= 25 * 1024 * 1024,
            count1Gb: Math.floor(1_000_000_000 / (bytes || 1)),
            count16Gb: Math.floor(16_000_000_000 / (bytes || 1)),
            count64Gb: Math.floor(64_000_000_000 / (bytes || 1)),
            count128Gb: Math.floor(128_000_000_000 / (bytes || 1)),
          },
        };
        resolve(analysis);
      };

      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const totalPixels = width * height;
        const megapixels = totalPixels > 0 ? totalPixels / 1_000_000 : 0;
        const bpp = totalPixels > 0 ? bits / totalPixels : 0;

        let aspectRatio = '—';
        if (width > 0 && height > 0) {
          const divisor = getGcd(width, height);
          aspectRatio = `${width / divisor}:${height / divisor} (${(width / height).toFixed(2)}:1)`;
        }

        const analysis: FileSizeAnalysis = {
          fileName: file.name,
          bytes,
          kbDecimal,
          mbDecimal,
          kibBinary,
          mibBinary,
          bits,
          mimeType: file.type || 'image/*',
          detectedFormat: magic.detected,
          isValidSignature: magic.isValid,
          width,
          height,
          megapixels,
          aspectRatio,
          bpp,
          webRating: getWebPerformanceRating(bytes),
          loadTimes: {
            fiber100M: calculateTransferTime(bytes, 100_000_000),
            lte4G: calculateTransferTime(bytes, 25_000_000),
            fast3G: calculateTransferTime(bytes, 1_600_000),
            slow3G: calculateTransferTime(bytes, 400_000),
            edge2G: calculateTransferTime(bytes, 50_000),
          },
          storageLimits: {
            fitsEmail25Mb: bytes <= 25 * 1024 * 1024,
            count1Gb: Math.floor(1_000_000_000 / (bytes || 1)),
            count16Gb: Math.floor(16_000_000_000 / (bytes || 1)),
            count64Gb: Math.floor(64_000_000_000 / (bytes || 1)),
            count128Gb: Math.floor(128_000_000_000 / (bytes || 1)),
          },
        };

        resolve(analysis);
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/** Client UI Controller Initialization */
export function initFileSizeChecker(): void {
  const dropzone = document.getElementById('size-dropzone') as HTMLElement | null;
  const fileInput = document.getElementById('size-file-input') as HTMLInputElement | null;
  const uploadView = document.getElementById('size-upload') as HTMLElement | null;
  const editorView = document.getElementById('size-editor') as HTMLElement | null;
  const errorView = document.getElementById('size-error') as HTMLElement | null;
  const errorMsg = document.getElementById('size-error-msg') as HTMLElement | null;
  const previewImg = document.getElementById('size-preview') as HTMLImageElement | null;
  const sampleBtn = document.getElementById('size-btn-sample') as HTMLButtonElement | null;
  const newBtn = document.getElementById('size-btn-new') as HTMLButtonElement | null;
  const copySizeBtn = document.getElementById('size-btn-copy-size') as HTMLButtonElement | null;
  const copyReportBtn = document.getElementById('size-btn-copy-report') as HTMLButtonElement | null;

  let currentAnalysis: FileSizeAnalysis | null = null;

  function showError(msg: string): void {
    if (errorView && errorMsg) {
      errorMsg.textContent = msg;
      errorView.hidden = false;
    }
  }

  function hideError(): void {
    if (errorView) errorView.hidden = true;
  }

  function populateUI(analysis: FileSizeAnalysis, objectUrl: string): void {
    currentAnalysis = analysis;
    hideError();

    if (previewImg) {
      previewImg.src = objectUrl;
    }

    // Overlay Badges
    const badgeBytes = document.getElementById('size-badge-bytes');
    const badgeKb = document.getElementById('size-badge-kb');
    const badgeRating = document.getElementById('size-badge-rating');
    if (badgeBytes) badgeBytes.textContent = `${formatNumber(analysis.bytes, 0)} Bytes`;
    if (badgeKb) badgeKb.textContent = `${formatNumber(analysis.kbDecimal, 2)} KB`;
    if (badgeRating) {
      badgeRating.textContent = analysis.webRating.label.split(' ')[0];
      badgeRating.className = `preview-tag tag-rating status-${analysis.webRating.status}`;
    }

    // Top 4 Metric Cards
    const valKb = document.getElementById('size-val-kb');
    const valBytes = document.getElementById('size-val-bytes');
    const valMb = document.getElementById('size-val-mb');
    const valBpp = document.getElementById('size-val-bpp');

    if (valKb) valKb.textContent = `${formatNumber(analysis.kbDecimal, 2)} KB (${formatNumber(analysis.kibBinary, 2)} KiB)`;
    if (valBytes) valBytes.textContent = `${formatNumber(analysis.bytes, 0)} Bytes (${formatNumber(analysis.bits, 0)} bits)`;
    if (valMb) valMb.textContent = `${formatNumber(analysis.mbDecimal, 3)} MB (${formatNumber(analysis.mibBinary, 3)} MiB)`;
    if (valBpp) valBpp.textContent = analysis.bpp > 0 ? `${formatNumber(analysis.bpp, 2)} bits/px` : 'Vector / N/A';

    // Web Rating Card
    const ratingCard = document.getElementById('size-rating-badge');
    const ratingDesc = document.getElementById('size-rating-desc');
    if (ratingCard) {
      ratingCard.textContent = analysis.webRating.label;
      ratingCard.className = `web-health-pill status-${analysis.webRating.status}`;
    }
    if (ratingDesc) {
      ratingDesc.textContent = analysis.webRating.description;
    }

    // Load Times
    const ltFiber = document.getElementById('size-lt-fiber');
    const lt4g = document.getElementById('size-lt-4g');
    const lt3gFast = document.getElementById('size-lt-3g-fast');
    const lt3gSlow = document.getElementById('size-lt-3g-slow');
    const lt2g = document.getElementById('size-lt-2g');

    if (ltFiber) ltFiber.textContent = analysis.loadTimes.fiber100M;
    if (lt4g) lt4g.textContent = analysis.loadTimes.lte4G;
    if (lt3gFast) lt3gFast.textContent = analysis.loadTimes.fast3G;
    if (lt3gSlow) lt3gSlow.textContent = analysis.loadTimes.slow3G;
    if (lt2g) lt2g.textContent = analysis.loadTimes.edge2G;

    // Technical Specs Table
    const tableFilename = document.getElementById('size-table-filename');
    const tableMime = document.getElementById('size-table-mime');
    const tableFormat = document.getElementById('size-table-format');
    const tableDim = document.getElementById('size-table-dimensions');
    const tableMp = document.getElementById('size-table-mp');
    const tableAspect = document.getElementById('size-table-aspect');

    if (tableFilename) tableFilename.textContent = analysis.fileName;
    if (tableMime) tableMime.textContent = analysis.mimeType;
    if (tableFormat) tableFormat.textContent = analysis.detectedFormat;
    if (tableDim) tableDim.textContent = analysis.width > 0 ? `${analysis.width} × ${analysis.height} px` : 'Scalable Vector';
    if (tableMp) tableMp.textContent = analysis.megapixels > 0 ? `${formatNumber(analysis.megapixels, 2)} MP` : 'N/A';
    if (tableAspect) tableAspect.textContent = analysis.aspectRatio;

    // Storage Capacity Table
    const capEmail = document.getElementById('size-cap-email');
    const cap1g = document.getElementById('size-cap-1g');
    const cap16g = document.getElementById('size-cap-16g');
    const cap64g = document.getElementById('size-cap-64g');
    const cap128g = document.getElementById('size-cap-128g');

    if (capEmail) {
      capEmail.textContent = analysis.storageLimits.fitsEmail25Mb ? 'Allowed (Under 25 MB)' : 'Exceeds 25 MB Limit';
      capEmail.className = analysis.storageLimits.fitsEmail25Mb ? 'spec-value status-ok-text' : 'spec-value status-warn-text';
    }
    if (cap1g) cap1g.textContent = `~${formatNumber(analysis.storageLimits.count1Gb, 0)} images`;
    if (cap16g) cap16g.textContent = `~${formatNumber(analysis.storageLimits.count16Gb, 0)} images`;
    if (cap64g) cap64g.textContent = `~${formatNumber(analysis.storageLimits.count64Gb, 0)} images`;
    if (cap128g) cap128g.textContent = `~${formatNumber(analysis.storageLimits.count128Gb, 0)} images`;

    // Toggle views
    if (uploadView) uploadView.hidden = true;
    if (editorView) editorView.hidden = false;
  }

  async function handleFile(file: File): Promise<void> {
    try {
      const objectUrl = URL.createObjectURL(file);
      const analysis = await analyzeImageFileSize(file);
      populateUI(analysis, objectUrl);
    } catch (err: any) {
      showError(err?.message || 'Failed to analyze image file size.');
    }
  }

  // Create sample image
  function createSampleImage(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Rich gradient
    const grad = ctx.createLinearGradient(0, 0, 1200, 800);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#312e81');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 800);

    // Decorative circle
    ctx.beginPath();
    ctx.arc(600, 400, 220, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
    ctx.fill();

    // Text watermark
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ImgFeel File Size Test', 600, 390);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '24px sans-serif';
    ctx.fillText('1200 × 800 px • High Definition Sample', 600, 440);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'sample-imgfeel-test.jpg', { type: 'image/jpeg' });
        handleFile(file);
      }
    }, 'image/jpeg', 0.92);
  }

  // Copy helpers
  function copyToClipboard(text: string, button: HTMLElement, successText: string): void {
    navigator.clipboard.writeText(text).then(() => {
      const originalHtml = button.innerHTML;
      button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>${successText}</span>
      `;
      setTimeout(() => {
        button.innerHTML = originalHtml;
      }, 2000);
    });
  }

  // Event Listeners
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('#size-btn-sample')) return;
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        handleFile(fileInput.files[0]);
      }
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dropzone-active');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dropzone-active');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dropzone-active');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
  }

  // Global Clipboard Paste (Ctrl+V)
  window.addEventListener('paste', (e: ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.items) {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            handleFile(file);
            break;
          }
        }
      }
    }
  });

  if (sampleBtn) {
    sampleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      createSampleImage();
    });
  }

  if (newBtn) {
    newBtn.addEventListener('click', () => {
      if (editorView) editorView.hidden = true;
      if (uploadView) uploadView.hidden = false;
      if (fileInput) fileInput.value = '';
      currentAnalysis = null;
    });
  }

  if (copySizeBtn) {
    copySizeBtn.addEventListener('click', () => {
      if (!currentAnalysis) return;
      const sizeText = `${formatNumber(currentAnalysis.kbDecimal, 2)} KB (${formatNumber(currentAnalysis.bytes, 0)} Bytes)`;
      copyToClipboard(sizeText, copySizeBtn, 'Copied Size!');
    });
  }

  if (copyReportBtn) {
    copyReportBtn.addEventListener('click', () => {
      if (!currentAnalysis) return;
      const report = [
        `# Image File Size Report (${currentAnalysis.fileName})`,
        `- **Exact File Size**: ${formatNumber(currentAnalysis.bytes, 0)} Bytes (${formatNumber(currentAnalysis.bits, 0)} bits)`,
        `- **Kilobytes (KB)**: ${formatNumber(currentAnalysis.kbDecimal, 2)} KB (Decimal) / ${formatNumber(currentAnalysis.kibBinary, 2)} KiB (Binary)`,
        `- **Megabytes (MB)**: ${formatNumber(currentAnalysis.mbDecimal, 3)} MB (Decimal) / ${formatNumber(currentAnalysis.mibBinary, 3)} MiB (Binary)`,
        `- **Dimensions**: ${currentAnalysis.width} × ${currentAnalysis.height} px (${currentAnalysis.aspectRatio})`,
        `- **Megapixels**: ${formatNumber(currentAnalysis.megapixels, 2)} MP`,
        `- **Bits Per Pixel (BPP)**: ${formatNumber(currentAnalysis.bpp, 2)} bpp`,
        `- **MIME Type**: ${currentAnalysis.mimeType} (${currentAnalysis.detectedFormat})`,
        `- **Web Performance**: ${currentAnalysis.webRating.label} — ${currentAnalysis.webRating.description}`,
        `- **4G LTE Load Time**: ${currentAnalysis.loadTimes.lte4G}`,
        `\n*Analyzed privately via ImgFeel.com Image File Size Checker.*`,
      ].join('\n');
      copyToClipboard(report, copyReportBtn, 'Copied Report!');
    });
  }
}

// Auto-run if DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFileSizeChecker);
  } else {
    initFileSizeChecker();
  }
}
