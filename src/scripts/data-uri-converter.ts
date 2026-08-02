/**
 * Image to Data URI Converter Client Engine
 * 100% Client-Side Processing with SVG UTF-8 Support
 */

export function initDataUriConverter() {
  const container = document.getElementById('datauri-converter-container');
  if (!container) return;

  const fileInput = document.getElementById('datauri-file-input') as HTMLInputElement;
  const dropzone = document.getElementById('datauri-dropzone') as HTMLElement;
  const editorArea = document.getElementById('datauri-editor-area') as HTMLElement;
  const warningBox = document.getElementById('datauri-warning-box') as HTMLElement;

  const imgPreview = document.getElementById('datauri-img-preview') as HTMLImageElement;
  const formatSelect = document.getElementById('datauri-format-select') as HTMLSelectElement;
  const svgUtf8Option = document.getElementById('datauri-opt-svg-utf8') as HTMLOptionElement;
  const outputTextarea = document.getElementById('datauri-output-textarea') as HTMLTextAreaElement;

  // Metadata Display Elements
  const infoFilename = document.getElementById('datauri-info-filename') as HTMLElement;
  const infoMime = document.getElementById('datauri-info-mime') as HTMLElement;
  const infoDim = document.getElementById('datauri-info-dim') as HTMLElement;
  const infoSize = document.getElementById('datauri-info-size') as HTMLElement;
  const infoLen = document.getElementById('datauri-info-len') as HTMLElement;

  // Action Buttons
  const copyBtn = document.getElementById('datauri-copy-btn') as HTMLButtonElement;
  const copyBtnText = document.getElementById('datauri-copy-btn-text') as HTMLElement;
  const downloadTxtBtn = document.getElementById('datauri-download-txt-btn') as HTMLButtonElement;
  const copyHtmlBtn = document.getElementById('datauri-copy-html-btn') as HTMLButtonElement;
  const copyCssBtn = document.getElementById('datauri-copy-css-btn') as HTMLButtonElement;
  const changeImgBtn = document.getElementById('datauri-change-img-btn') as HTMLButtonElement;

  if (!fileInput || !dropzone || !editorArea) return;

  // State
  let base64DataUrl = '';
  let svgUtf8DataUri = '';
  let isSvg = false;
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
    currentFile = file;
    isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

    // Show warning if file > 10 MB
    const isLarge = file.size > 10 * 1024 * 1024;
    if (warningBox) warningBox.hidden = !isLarge;

    // Show SVG UTF-8 option if file is SVG
    if (svgUtf8Option) svgUtf8Option.hidden = !isSvg;

    const b64Reader = new FileReader();
    b64Reader.onload = (e) => {
      base64DataUrl = e.target?.result as string;

      if (isSvg) {
        const textReader = new FileReader();
        textReader.onload = (textEvt) => {
          const svgText = textEvt.target?.result as string;
          const encodedSvg = encodeURIComponent(svgText)
            .replace(/'/g, '%27')
            .replace(/"/g, '%22');
          svgUtf8DataUri = `data:image/svg+xml;utf8,${encodedSvg}`;
          finishProcessing(file);
        };
        textReader.readAsText(file);
      } else {
        svgUtf8DataUri = '';
        finishProcessing(file);
      }
    };

    b64Reader.readAsDataURL(file);
  }

  function finishProcessing(file: File) {
    const activeUri = getActiveDataUri();

    // Update image preview & dimensions
    const img = new Image();
    img.onload = () => {
      if (imgPreview) imgPreview.src = base64DataUrl;
      if (infoDim) infoDim.textContent = `${img.width} × ${img.height} px`;
    };
    img.src = base64DataUrl;

    // Populate Metadata Card
    if (infoFilename) infoFilename.textContent = file.name;
    if (infoMime) infoMime.textContent = file.type || (isSvg ? 'image/svg+xml' : 'image/*');
    if (infoSize) infoSize.textContent = formatBytes(file.size);

    updateOutputTextarea();

    dropzone.hidden = true;
    editorArea.hidden = false;
  }

  formatSelect?.addEventListener('change', updateOutputTextarea);

  function getActiveDataUri(): string {
    if (isSvg && formatSelect?.value === 'svgUtf8') {
      return svgUtf8DataUri;
    }
    return base64DataUrl;
  }

  function updateOutputTextarea() {
    if (!outputTextarea) return;
    const activeUri = getActiveDataUri();
    outputTextarea.value = activeUri;
    if (infoLen) infoLen.textContent = `${activeUri.length.toLocaleString()} chars`;
  }

  // Copy Main Data URI
  copyBtn?.addEventListener('click', () => {
    if (!outputTextarea) return;
    copyToClipboard(outputTextarea.value, copyBtn, copyBtnText);
  });

  // Copy HTML Tag
  copyHtmlBtn?.addEventListener('click', () => {
    const uri = getActiveDataUri();
    if (!uri || !currentFile) return;
    const htmlSnippet = `<img src="${uri}" alt="${escapeHtml(currentFile.name)}" />`;
    copyToClipboard(htmlSnippet, copyHtmlBtn);
  });

  // Copy CSS Background
  copyCssBtn?.addEventListener('click', () => {
    const uri = getActiveDataUri();
    if (!uri) return;
    const cssSnippet = `background-image: url('${uri}');`;
    copyToClipboard(cssSnippet, copyCssBtn);
  });

  // Download .txt
  downloadTxtBtn?.addEventListener('click', () => {
    const uri = getActiveDataUri();
    if (!uri || !currentFile) return;
    const blob = new Blob([uri], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${currentFile.name.replace(/\.[^/.]+$/, '')}-data-uri.txt`;
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
  document.addEventListener('DOMContentLoaded', initDataUriConverter);
} else {
  initDataUriConverter();
}
