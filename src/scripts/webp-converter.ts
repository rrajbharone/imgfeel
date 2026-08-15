/**
 * ImgFeel WebP to JPG/PNG Converter — Ultra-Fast In-Browser Engine
 * GPU-accelerated Canvas conversion, transparency handling, single & batch UI, and ZIP export.
 */

import { downloadBlob, createAndDownloadZip, formatBytes } from './converter-utils';

interface WebpQueueItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  width: number;
  height: number;
  status: 'queued' | 'converting' | 'converted' | 'error';
  resultBlob: Blob | null;
  resultUrl: string | null;
  resultSize: number;
  outputFormat: 'jpg' | 'png';
  errorMessage: string | null;
  thumbnailUrl: string | null;
}

const app = document.getElementById('webp-converter-app');
if (!app) throw new Error('WebP converter app container not found');

// Localized strings
const i18n = {
  statusQueued: app.dataset.i18nStatusQueued ?? 'Queued',
  statusConverting: app.dataset.i18nStatusConverting ?? 'Converting...',
  statusConverted: app.dataset.i18nStatusConverted ?? 'Ready',
  statusError: app.dataset.i18nStatusError ?? 'Failed',
  actionDownload: app.dataset.i18nActionDownload ?? 'Download',
  actionDownloadJpg: app.dataset.i18nActionDownloadJpg ?? 'Download JPG',
  actionDownloadPng: app.dataset.i18nActionDownloadPng ?? 'Download PNG',
  actionConvertSingle: app.dataset.i18nActionConvertSingle ?? 'Convert Image',
  actionConvertAll: app.dataset.i18nActionConvertAll ?? 'Convert Images',
  actionDownloadAll: app.dataset.i18nActionDownloadAll ?? 'Download All',
  infoOriginal: app.dataset.i18nInfoOriginal ?? 'WebP Size',
  infoOutput: app.dataset.i18nInfoOutput ?? 'Output Size',
  errorInvalidType: app.dataset.i18nErrorInvalidType ?? 'Please select valid .WebP image files.',
  errorLoadFailed: app.dataset.i18nErrorLoadFailed ?? 'Could not decode this WebP image.',
};

// DOM Elements
const uploadZone = document.getElementById('webp-upload-zone')!;
const dropzone = document.getElementById('webp-dropzone')!;
const fileInput = document.getElementById('webp-file-input') as HTMLInputElement;
const browseBtn = document.getElementById('webp-browse-btn');

// Format & Quality Controls
const formatRadios = document.querySelectorAll<HTMLInputElement>('input[name="webp-target-format"]');
const qualityWrappers = document.querySelectorAll<HTMLElement>('.webp-quality-wrapper');
const qualityRadios = document.querySelectorAll<HTMLInputElement>('input[name="webp-jpg-quality"]');

// Single-Image UI Elements
const singleEditor = document.getElementById('webp-single-editor')!;
const singlePreviewImg = document.getElementById('webp-single-preview') as HTMLImageElement;
const singleFilename = document.getElementById('webp-single-filename')!;
const singleOriginalSize = document.getElementById('webp-single-original-size')!;
const singleDimensions = document.getElementById('webp-single-dimensions')!;
const singleResultCard = document.getElementById('webp-single-result-card')!;
const singleResultFormat = document.getElementById('webp-single-result-format')!;
const singleResultSize = document.getElementById('webp-single-result-size')!;
const singleBtnConvert = document.getElementById('webp-single-btn-convert') as HTMLButtonElement;
const singleBtnDownload = document.getElementById('webp-single-btn-download') as HTMLButtonElement;
const singleBtnNew = document.getElementById('webp-single-btn-new') as HTMLButtonElement;

// Batch UI Elements
const batchSection = document.getElementById('webp-batch-section')!;
const batchList = document.getElementById('webp-batch-list')!;
const batchBtnConvertAll = document.getElementById('btn-webp-convert-all') as HTMLButtonElement;
const batchBtnDownloadAll = document.getElementById('btn-webp-download-all') as HTMLButtonElement;
const batchBtnClearAll = document.getElementById('btn-webp-clear-all') as HTMLButtonElement;
const batchBtnAddMore = document.getElementById('btn-webp-add-more') as HTMLButtonElement;

// Error Toast
const errorBox = document.getElementById('webp-error-message')!;
const errorMessageText = document.getElementById('webp-error-text')!;

let targetFormat: 'jpg' | 'png' = 'jpg';
let currentQuality = 0.8; // Default: 80% (Balanced)
let queue: WebpQueueItem[] = [];
let isProcessing = false;

function showError(msg: string): void {
  errorMessageText.textContent = msg;
  errorBox.hidden = false;
  setTimeout(() => {
    errorBox.hidden = true;
  }, 6000);
}

function isWebpFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    name.endsWith('.webp') ||
    type === 'image/webp' ||
    (type === 'application/octet-stream' && name.endsWith('.webp')) ||
    (type === '' && name.endsWith('.webp'))
  );
}

// Format toggle listener
formatRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    targetFormat = radio.value as 'jpg' | 'png';
    // Sync all format radios
    formatRadios.forEach((r) => {
      if (r.value === targetFormat) r.checked = true;
    });

    // Show/hide quality selector
    qualityWrappers.forEach((w) => {
      w.hidden = targetFormat !== 'jpg';
    });

    // If single image exists, trigger re-conversion
    if (queue.length === 1 && !isProcessing) {
      queue[0].outputFormat = targetFormat;
      convertSingleItem(queue[0]);
    } else if (queue.length > 1) {
      queue.forEach((item) => {
        if (item.status === 'queued') item.outputFormat = targetFormat;
      });
      renderUI();
    }
  });
});

// Quality listener
qualityRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    currentQuality = parseFloat(radio.value);
    // Sync all quality radios
    qualityRadios.forEach((r) => {
      if (r.value === radio.value) r.checked = true;
    });

    if (queue.length === 1 && targetFormat === 'jpg' && !isProcessing) {
      convertSingleItem(queue[0]);
    }
  });
});

/**
 * Main Render Dispatcher: Switch between Dropzone, Single-Image Editor, and Batch Queue
 */
function renderUI(): void {
  if (queue.length === 0) {
    uploadZone.hidden = false;
    singleEditor.hidden = true;
    batchSection.hidden = true;
    fileInput.value = '';
    return;
  }

  uploadZone.hidden = true;

  if (queue.length === 1) {
    singleEditor.hidden = false;
    batchSection.hidden = true;
    renderSingleEditor(queue[0]);
  } else {
    singleEditor.hidden = true;
    batchSection.hidden = false;
    renderBatchQueue();
  }
}

/**
 * Render Single-Image Editor
 */
function renderSingleEditor(item: HeicQueueItem | WebpQueueItem): void {
  singleFilename.textContent = item.name;
  singleOriginalSize.textContent = formatBytes(item.originalSize);
  singleDimensions.textContent = item.width > 0 && item.height > 0 ? `${item.width} × ${item.height} px` : '...';

  if (item.resultUrl || item.thumbnailUrl) {
    singlePreviewImg.src = item.resultUrl || item.thumbnailUrl!;
  }

  if (item.status === 'converting') {
    singleBtnConvert.hidden = false;
    singleBtnConvert.disabled = true;
    singleBtnConvert.innerHTML = `<span class="spinner"></span> ${i18n.statusConverting}`;
    singleBtnDownload.hidden = true;
    singleResultCard.hidden = true;
  } else if (item.status === 'converted' && item.resultBlob) {
    singleBtnConvert.hidden = true;
    singleBtnDownload.hidden = false;
    singleBtnDownload.disabled = false;

    const ext = item.outputFormat === 'png' ? 'PNG' : 'JPG';
    singleBtnDownload.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      <span>${item.outputFormat === 'png' ? i18n.actionDownloadPng : i18n.actionDownloadJpg}</span>
    `;

    singleResultCard.hidden = false;
    singleResultFormat.textContent = ext;
    singleResultSize.textContent = formatBytes(item.resultSize);
  } else {
    singleBtnConvert.hidden = false;
    singleBtnConvert.disabled = false;
    singleBtnConvert.textContent = i18n.actionConvertSingle;
    singleBtnDownload.hidden = true;
    singleResultCard.hidden = true;
  }
}

/**
 * Render Batch Queue
 */
function renderBatchQueue(): void {
  const convertedCount = queue.filter((i) => i.status === 'converted').length;
  const queuedCount = queue.filter((i) => i.status === 'queued').length;

  batchBtnConvertAll.hidden = queuedCount === 0;
  batchBtnConvertAll.textContent = `${i18n.actionConvertAll} (${queuedCount})`;

  batchBtnDownloadAll.hidden = convertedCount === 0;
  batchBtnDownloadAll.textContent = `${i18n.actionDownloadAll} (${convertedCount})`;

  batchList.innerHTML = '';

  queue.forEach((item) => {
    const card = document.createElement('div');
    card.className = `queue-card status-${item.status}`;
    card.id = `item-${item.id}`;

    const baseName = item.name.replace(/\.[^.]+$/, '');
    const ext = item.outputFormat === 'png' ? 'png' : 'jpg';
    const outputName = `${baseName}.${ext}`;
    const downloadLabel = item.outputFormat === 'png' ? i18n.actionDownloadPng : i18n.actionDownloadJpg;

    card.innerHTML = `
      <div class="queue-item-thumb">
        ${
          item.resultUrl || item.thumbnailUrl
            ? `<img src="${item.resultUrl || item.thumbnailUrl}" alt="${outputName}" class="thumb-img" />`
            : `<div class="thumb-placeholder">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span>WEBP</span>
              </div>`
        }
      </div>

      <div class="queue-item-meta">
        <div class="meta-name" title="${item.name}">${item.name}</div>
        <div class="meta-sizes">
          <span>${i18n.infoOriginal}: ${formatBytes(item.originalSize)}</span>
          ${item.resultSize ? `<span> • ${i18n.infoOutput} (${item.outputFormat.toUpperCase()}): <strong>${formatBytes(item.resultSize)}</strong></span>` : ''}
        </div>
        ${item.errorMessage ? `<div class="meta-error">${item.errorMessage}</div>` : ''}
      </div>

      <div class="queue-item-status">
        <span class="status-badge badge-${item.status}">
          ${
            item.status === 'queued'
              ? `${i18n.statusQueued} → ${item.outputFormat.toUpperCase()}`
              : item.status === 'converting'
                ? `<span class="spinner"></span> ${i18n.statusConverting}`
                : item.status === 'converted'
                  ? `✓ ${item.outputFormat.toUpperCase()} ${i18n.statusConverted}`
                  : `✗ ${i18n.statusError}`
          }
        </span>
      </div>

      <div class="queue-item-actions">
        ${
          item.status === 'converted'
            ? `<button type="button" class="btn btn-sm btn-primary btn-item-download" data-id="${item.id}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>${downloadLabel}</span>
              </button>`
            : ''
        }
        <button type="button" class="btn-item-remove" data-id="${item.id}" aria-label="Remove item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;

    batchList.appendChild(card);
  });

  // Attach card event listeners
  batchList.querySelectorAll<HTMLButtonElement>('.btn-item-download').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = queue.find((i) => i.id === id);
      if (item && item.resultBlob) {
        const baseName = item.name.replace(/\.[^.]+$/, '');
        const ext = item.outputFormat === 'png' ? 'png' : 'jpg';
        downloadBlob(item.resultBlob, `${baseName}.${ext}`);
      }
    });
  });

  batchList.querySelectorAll<HTMLButtonElement>('.btn-item-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      removeItem(id!);
    });
  });
}

function removeItem(id: string): void {
  const index = queue.findIndex((i) => i.id === id);
  if (index !== -1) {
    const item = queue[index];
    if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    if (item.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
    queue.splice(index, 1);
    renderUI();
  }
}

function clearAll(): void {
  queue.forEach((item) => {
    if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    if (item.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
  });
  queue = [];
  fileInput.value = '';
  isProcessing = false;
  renderUI();
}

/**
 * Core Conversion Function for a Single WebP Item
 */
async function convertSingleItem(item: WebpQueueItem): Promise<void> {
  item.status = 'converting';
  renderUI();

  try {
    let imgSource: ImageBitmap | HTMLImageElement;

    if ('createImageBitmap' in window) {
      try {
        imgSource = await createImageBitmap(item.file);
      } catch {
        imgSource = await loadImgFallback(item.file);
      }
    } else {
      imgSource = await loadImgFallback(item.file);
    }

    item.width = imgSource.width;
    item.height = imgSource.height;

    const canvas = document.createElement('canvas');
    canvas.width = imgSource.width;
    canvas.height = imgSource.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');

    if (item.outputFormat === 'jpg') {
      // Clean solid white background for transparent pixels
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgSource, 0, 0);

      const mimeType = 'image/jpeg';
      const resultBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Canvas toBlob failed'));
          },
          mimeType,
          currentQuality
        );
      });

      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      item.resultBlob = resultBlob;
      item.resultUrl = URL.createObjectURL(resultBlob);
      item.resultSize = resultBlob.size;
      item.status = 'converted';
      item.errorMessage = null;
    } else {
      // Transparent background preserved for PNG
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgSource, 0, 0);

      const mimeType = 'image/png';
      const resultBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Canvas toBlob failed'));
        }, mimeType);
      });

      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      item.resultBlob = resultBlob;
      item.resultUrl = URL.createObjectURL(resultBlob);
      item.resultSize = resultBlob.size;
      item.status = 'converted';
      item.errorMessage = null;
    }

    if ('close' in imgSource && typeof (imgSource as ImageBitmap).close === 'function') {
      (imgSource as ImageBitmap).close();
    }
  } catch (err: any) {
    console.error('WebP conversion error:', err);
    item.status = 'error';
    item.errorMessage = i18n.errorLoadFailed;
  }

  renderUI();
}

function loadImgFallback(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
}

/**
 * Convert all queued items sequentially
 */
async function convertAll(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  batchBtnConvertAll.disabled = true;
  batchBtnAddMore.disabled = true;

  const queuedItems = queue.filter((i) => i.status === 'queued');
  for (const item of queuedItems) {
    item.outputFormat = targetFormat;
    await convertSingleItem(item);
  }

  isProcessing = false;
  batchBtnConvertAll.disabled = false;
  batchBtnAddMore.disabled = false;
  renderUI();
}

/**
 * Download All as ZIP
 */
async function downloadAllZip(): Promise<void> {
  const convertedItems = queue.filter((i) => i.status === 'converted' && i.resultBlob);
  if (convertedItems.length === 0) return;

  batchBtnDownloadAll.disabled = true;
  const originalText = batchBtnDownloadAll.textContent;
  batchBtnDownloadAll.textContent = 'Creating ZIP...';

  try {
    const filesToZip = convertedItems.map((item) => {
      const baseName = item.name.replace(/\.[^.]+$/, '');
      const ext = item.outputFormat === 'png' ? 'png' : 'jpg';
      return {
        name: `${baseName}.${ext}`,
        blob: item.resultBlob!,
      };
    });

    await createAndDownloadZip(filesToZip, 'imgfeel-webp-converted-images.zip');
  } catch (err) {
    console.error('ZIP generation error:', err);
    showError('Could not generate ZIP archive.');
  } finally {
    batchBtnDownloadAll.disabled = false;
    batchBtnDownloadAll.textContent = originalText;
  }
}

/**
 * Handle new files
 */
function handleFiles(files: FileList | File[]): void {
  let hasValid = false;
  let hasInvalid = false;

  Array.from(files).forEach((file) => {
    if (isWebpFile(file)) {
      hasValid = true;
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const thumbUrl = URL.createObjectURL(file);
      queue.push({
        id,
        file,
        name: file.name,
        originalSize: file.size,
        width: 0,
        height: 0,
        status: 'queued',
        resultBlob: null,
        resultUrl: null,
        resultSize: 0,
        outputFormat: targetFormat,
        errorMessage: null,
        thumbnailUrl: thumbUrl,
      });
    } else {
      hasInvalid = true;
    }
  });

  if (hasInvalid && !hasValid) {
    showError(i18n.errorInvalidType);
  }

  renderUI();

  // Auto-convert newly added files
  if (hasValid && !isProcessing) {
    if (queue.length === 1) {
      convertSingleItem(queue[0]);
    } else {
      convertAll();
    }
  }
}

// Event Listeners
dropzone.addEventListener('click', () => fileInput.click());

browseBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});

dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

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
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    handleFiles(e.dataTransfer.files);
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files && fileInput.files.length > 0) {
    handleFiles(fileInput.files);
  }
});

// Single editor events
singleBtnConvert.addEventListener('click', () => {
  if (queue.length === 1) convertSingleItem(queue[0]);
});

singleBtnDownload.addEventListener('click', () => {
  if (queue.length === 1 && queue[0].resultBlob) {
    const baseName = queue[0].name.replace(/\.[^.]+$/, '');
    const ext = queue[0].outputFormat === 'png' ? 'png' : 'jpg';
    downloadBlob(queue[0].resultBlob, `${baseName}.${ext}`);
  }
});

singleBtnNew.addEventListener('click', () => clearAll());

// Batch events
batchBtnConvertAll.addEventListener('click', () => convertAll());
batchBtnDownloadAll.addEventListener('click', () => downloadAllZip());
batchBtnClearAll.addEventListener('click', () => clearAll());
batchBtnAddMore.addEventListener('click', () => fileInput.click());
