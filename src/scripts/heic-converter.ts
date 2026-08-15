/**
 * ImgFeel HEIC to JPG Converter — High-Performance In-Browser Engine
 * Handles single-image and batch modes, reliable downloads, and ZIP archiving.
 */

import { downloadBlob, createAndDownloadZip, formatBytes } from './converter-utils';

interface HeicQueueItem {
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
  errorMessage: string | null;
  thumbnailUrl: string | null;
}

const app = document.getElementById('heic-converter-app');
if (!app) throw new Error('HEIC converter app container not found');

// Localized strings
const i18n = {
  statusQueued: app.dataset.i18nStatusQueued ?? 'Queued',
  statusConverting: app.dataset.i18nStatusConverting ?? 'Converting...',
  statusConverted: app.dataset.i18nStatusConverted ?? 'Ready',
  statusError: app.dataset.i18nStatusError ?? 'Failed',
  actionDownload: app.dataset.i18nActionDownload ?? 'Download JPG',
  actionConvertSingle: app.dataset.i18nActionConvertSingle ?? 'Convert to JPG',
  actionConvertAll: app.dataset.i18nActionConvertAll ?? 'Convert All',
  actionDownloadAll: app.dataset.i18nActionDownloadAll ?? 'Download All',
  infoOriginalSize: app.dataset.i18nInfoOriginal ?? 'Original Size',
  infoOutputSize: app.dataset.i18nInfoJpgSize ?? 'JPG Size',
  errorInvalidType: app.dataset.i18nErrorInvalidType ?? 'Please select valid .HEIC or .HEIF files.',
  errorDecodeFailed: app.dataset.i18nErrorDecodeFailed ?? 'Could not decode this HEIC file.',
};

// DOM Elements
const uploadZone = document.getElementById('heic-upload-zone')!;
const dropzone = document.getElementById('heic-dropzone')!;
const fileInput = document.getElementById('heic-file-input') as HTMLInputElement;
const browseBtn = document.getElementById('heic-browse-btn');

// Single-Image UI Elements
const singleEditor = document.getElementById('heic-single-editor')!;
const singlePreviewImg = document.getElementById('heic-single-preview') as HTMLHTMLInputElement | HTMLImageElement;
const singlePlaceholder = document.getElementById('heic-single-placeholder')!;
const singleFilename = document.getElementById('heic-single-filename')!;
const singleOriginalSize = document.getElementById('heic-single-original-size')!;
const singleDimensions = document.getElementById('heic-single-dimensions')!;
const singleResultCard = document.getElementById('heic-single-result-card')!;
const singleResultSize = document.getElementById('heic-single-result-size')!;
const singleResultSavings = document.getElementById('heic-single-result-savings')!;
const singleBtnConvert = document.getElementById('heic-single-btn-convert') as HTMLButtonElement;
const singleBtnDownload = document.getElementById('heic-single-btn-download') as HTMLButtonElement;
const singleBtnNew = document.getElementById('heic-single-btn-new') as HTMLButtonElement;

// Batch UI Elements
const batchSection = document.getElementById('heic-batch-section')!;
const batchList = document.getElementById('heic-batch-list')!;
const batchBtnConvertAll = document.getElementById('btn-heic-convert-all') as HTMLButtonElement;
const batchBtnDownloadAll = document.getElementById('btn-heic-download-all') as HTMLButtonElement;
const batchBtnClearAll = document.getElementById('btn-heic-clear-all') as HTMLButtonElement;
const batchBtnAddMore = document.getElementById('btn-heic-add-more') as HTMLButtonElement;

// Quality Radios (both single & batch)
const qualityRadios = document.querySelectorAll<HTMLInputElement>('input[name="heic-quality"]');

// Error Toast
const errorBox = document.getElementById('heic-error-message')!;
const errorMessageText = document.getElementById('heic-error-text')!;

let currentQuality = 0.8; // Default: Balanced (80%)
let queue: HeicQueueItem[] = [];
let isProcessing = false;

function showError(msg: string): void {
  errorMessageText.textContent = msg;
  errorBox.hidden = false;
  setTimeout(() => {
    errorBox.hidden = true;
  }, 6000);
}

function isHeicFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    type === 'image/heic' ||
    type === 'image/heif' ||
    type === 'image/heic-sequence' ||
    type === 'image/heif-sequence' ||
    (type === '' && (name.endsWith('.heic') || name.endsWith('.heif'))) ||
    (type === 'application/octet-stream' && (name.endsWith('.heic') || name.endsWith('.heif')))
  );
}

// Sync quality across radios
qualityRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    currentQuality = parseFloat(radio.value);
    // If single image exists and was already converted, re-convert with new quality
    if (queue.length === 1 && queue[0].status === 'converted' && !isProcessing) {
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
    // Single image mode
    singleEditor.hidden = false;
    batchSection.hidden = true;
    renderSingleEditor(queue[0]);
  } else {
    // Batch mode (2+ images)
    singleEditor.hidden = true;
    batchSection.hidden = false;
    renderBatchQueue();
  }
}

/**
 * Render Single-Image Editor
 */
function renderSingleEditor(item: HeicQueueItem): void {
  singleFilename.textContent = item.name;
  singleOriginalSize.textContent = formatBytes(item.originalSize);
  singleDimensions.textContent = item.width > 0 && item.height > 0 ? `${item.width} × ${item.height} px` : 'Auto';

  if (item.resultUrl) {
    singlePreviewImg.hidden = false;
    singlePlaceholder.hidden = true;
    (singlePreviewImg as HTMLImageElement).src = item.resultUrl;
  } else {
    singlePreviewImg.hidden = true;
    singlePlaceholder.hidden = false;
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
    singleResultCard.hidden = false;
    singleResultSize.textContent = formatBytes(item.resultSize);

    const savings = Math.round(((item.originalSize - item.resultSize) / item.originalSize) * 100);
    if (savings > 0) {
      singleResultSavings.textContent = `(${savings}% smaller)`;
      singleResultSavings.className = 'result-savings savings-positive';
    } else {
      singleResultSavings.textContent = '';
    }
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
    const outputName = `${baseName}.jpg`;

    card.innerHTML = `
      <div class="queue-item-thumb">
        ${
          item.resultUrl
            ? `<img src="${item.resultUrl}" alt="${outputName}" class="thumb-img" />`
            : `<div class="thumb-placeholder">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span>HEIC</span>
              </div>`
        }
      </div>

      <div class="queue-item-meta">
        <div class="meta-name" title="${item.name}">${item.name}</div>
        <div class="meta-sizes">
          <span>${i18n.infoOriginalSize}: ${formatBytes(item.originalSize)}</span>
          ${item.resultSize ? `<span> • ${i18n.infoOutputSize}: <strong>${formatBytes(item.resultSize)}</strong></span>` : ''}
        </div>
        ${item.errorMessage ? `<div class="meta-error">${item.errorMessage}</div>` : ''}
      </div>

      <div class="queue-item-status">
        <span class="status-badge badge-${item.status}">
          ${
            item.status === 'queued'
              ? i18n.statusQueued
              : item.status === 'converting'
                ? `<span class="spinner"></span> ${i18n.statusConverting}`
                : item.status === 'converted'
                  ? `✓ ${i18n.statusConverted}`
                  : `✗ ${i18n.statusError}`
          }
        </span>
      </div>

      <div class="queue-item-actions">
        ${
          item.status === 'converted'
            ? `<button type="button" class="btn btn-sm btn-primary btn-item-download" data-id="${item.id}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>${i18n.actionDownload}</span>
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
        downloadBlob(item.resultBlob, `${baseName}.jpg`);
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
 * Core Conversion Function for a Single HEIC Item
 */
async function convertSingleItem(item: HeicQueueItem): Promise<void> {
  item.status = 'converting';
  renderUI();

  try {
    const heic2anyModule = await import('heic2any');
    const heic2any = (heic2anyModule as any).default || heic2anyModule;

    const conversionResult = await heic2any({
      blob: item.file,
      toType: 'image/jpeg',
      quality: currentQuality,
    });

    const resultBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;

    if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    item.resultBlob = resultBlob;
    item.resultUrl = URL.createObjectURL(resultBlob);
    item.resultSize = resultBlob.size;
    item.status = 'converted';
    item.errorMessage = null;

    // Try reading dimensions from converted JPEG
    try {
      const img = new Image();
      img.src = item.resultUrl;
      await new Promise<void>((resolve) => {
        img.onload = () => {
          item.width = img.naturalWidth;
          item.height = img.naturalHeight;
          resolve();
        };
        img.onerror = () => resolve();
      });
    } catch {
      // Ignored
    }
  } catch (err: any) {
    console.error('HEIC conversion error:', err);
    item.status = 'error';
    item.errorMessage = i18n.errorDecodeFailed;
  }

  renderUI();
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
      return {
        name: `${baseName}.jpg`,
        blob: item.resultBlob!,
      };
    });

    await createAndDownloadZip(filesToZip, 'imgfeel-heic-to-jpg.zip');
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
    if (isHeicFile(file)) {
      hasValid = true;
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
        errorMessage: null,
        thumbnailUrl: null,
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
    downloadBlob(queue[0].resultBlob, `${baseName}.jpg`);
  }
});

singleBtnNew.addEventListener('click', () => clearAll());

// Batch events
batchBtnConvertAll.addEventListener('click', () => convertAll());
batchBtnDownloadAll.addEventListener('click', () => downloadAllZip());
batchBtnClearAll.addEventListener('click', () => clearAll());
batchBtnAddMore.addEventListener('click', () => fileInput.click());
