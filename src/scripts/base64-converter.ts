/**
 * Image to Base64 Converter Client Engine
 * 100% Client-Side FileReader Processing
 */

export function initBase64Converter() {
  const container = document.getElementById('b64-converter-container');
  if (!container) return;

  const fileInput = document.getElementById('b64-file-input') as HTMLInputElement;
  const dropzone = document.getElementById('b64-dropzone') as HTMLElement;
  const editorArea = document.getElementById('b64-editor-area') as HTMLElement;
  const warningBox = document.getElementById('b64-warning-box') as HTMLElement;

  const imgPreview = document.getElementById('b64-img-preview') as HTMLImageElement;
  const formatSelect = document.getElementById('b64-format-select') as HTMLSelectElement;
  const outputTextarea = document.getElementById('b64-output-textarea') as HTMLTextAreaElement;

  // Metadata Display Elements
  const infoFilename = document.getElementById('b64-info-filename') as HTMLElement;
  const infoMime = document.getElementById('b64-info-mime') as HTMLElement;
  const infoDim = document.getElementById('b64-info-dim') as HTMLElement;
  const infoSize = document.getElementById('b64-info-size') as HTMLElement;
  const infoLen = document.getElementById('b64-info-len') as HTMLElement;

  // Action Buttons
  const copyBtn = document.getElementById('b64-copy-btn') as HTMLButtonElement;
  const copyBtnText = document.getElementById('b64-copy-btn-text') as HTMLElement;
  const downloadTxtBtn = document.getElementById('b64-download-txt-btn') as HTMLButtonElement;
  const copyHtmlBtn = document.getElementById('b64-copy-html-btn') as HTMLButtonElement;
  const copyCssBtn = document.getElementById('b64-copy-css-btn') as HTMLButtonElement;
  const changeImgBtn = document.getElementById('b64-change-img-btn') as HTMLButtonElement;

  if (!fileInput || !dropzone || !editorArea) return;

  // State
  let fullDataUrl = '';
  let rawBase64 = '';
  let currentFile: File | null = null;

  // Event Listeners
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) handleFile(file);
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const file = e.dataTransfer?.files[0];
    if (file) handleFile(file);
  });

  changeImgBtn?.addEventListener('click', () => fileInput.click());

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    currentFile = file;

    // Show warning if file > 10 MB
    const isLarge = file.size > 10 * 1024 * 1024;
    if (warningBox) warningBox.hidden = !isLarge;

    const reader = new FileReader();
    reader.onload = (e) => {
      fullDataUrl = e.target?.result as string;
      const commaIdx = fullDataUrl.indexOf(',');
      rawBase64 = commaIdx !== -1 ? fullDataUrl.slice(commaIdx + 1) : fullDataUrl;

      // Update image preview & dimensions
      const img = new Image();
      img.onload = () => {
        if (imgPreview) imgPreview.src = fullDataUrl;
        if (infoDim) infoDim.textContent = `${img.width} × ${img.height} px`;
      };
      img.src = fullDataUrl;

      // Populate Metadata Card
      if (infoFilename) infoFilename.textContent = file.name;
      if (infoMime) infoMime.textContent = file.type || 'image/*';
      if (infoSize) infoSize.textContent = formatBytes(file.size);
      if (infoLen) infoLen.textContent = `${fullDataUrl.length.toLocaleString()} chars`;

      updateOutputTextarea();

      dropzone.hidden = true;
      editorArea.hidden = false;
    };

    reader.readAsDataURL(file);
  }

  formatSelect?.addEventListener('change', updateOutputTextarea);

  function updateOutputTextarea() {
    if (!outputTextarea) return;
    const isRaw = formatSelect?.value === 'raw';
    outputTextarea.value = isRaw ? rawBase64 : fullDataUrl;
  }

  // Copy Main Base64
  copyBtn?.addEventListener('click', () => {
    if (!outputTextarea) return;
    copyToClipboard(outputTextarea.value, copyBtn, copyBtnText);
  });

  // Copy HTML Tag
  copyHtmlBtn?.addEventListener('click', () => {
    if (!fullDataUrl || !currentFile) return;
    const htmlSnippet = `<img src="${fullDataUrl}" alt="${escapeHtml(currentFile.name)}" />`;
    copyToClipboard(htmlSnippet, copyHtmlBtn);
  });

  // Copy CSS Background
  copyCssBtn?.addEventListener('click', () => {
    if (!fullDataUrl) return;
    const cssSnippet = `background-image: url('${fullDataUrl}');`;
    copyToClipboard(cssSnippet, copyCssBtn);
  });

  // Download .txt
  downloadTxtBtn?.addEventListener('click', () => {
    if (!fullDataUrl || !currentFile) return;
    const textToSave = outputTextarea?.value || fullDataUrl;
    const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${currentFile.name.replace(/\.[^/.]+$/, '')}-base64.txt`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  });

  function copyToClipboard(text: string, btnElement: HTMLButtonElement, textSpan?: HTMLElement | null) {
    navigator.clipboard.writeText(text).then(() => {
      const originalText = textSpan ? textSpan.textContent : btnElement.textContent;
      if (textSpan) {
        textSpan.textContent = textSpan.dataset.copied || 'Copied!';
      } else {
        btnElement.setAttribute('data-orig-text', originalText || '');
        btnElement.textContent = 'Copied!';
      }
      btnElement.classList.add('copy-success');

      setTimeout(() => {
        if (textSpan) {
          textSpan.textContent = originalText;
        } else {
          btnElement.textContent = btnElement.getAttribute('data-orig-text') || originalText;
        }
        btnElement.classList.remove('copy-success');
      }, 2000);
    });
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

// Auto-initialize DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBase64Converter);
} else {
  initBase64Converter();
}
