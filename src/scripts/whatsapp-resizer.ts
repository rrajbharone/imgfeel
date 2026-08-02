/**
 * WhatsApp DP Resizer Client Engine
 * 100% Client-Side Canvas Processing
 */

export function initWhatsAppResizer() {
  const container = document.getElementById('wa-resizer-container');
  if (!container) return;

  const fileInput = document.getElementById('wa-file-input') as HTMLInputElement;
  const dropzone = document.getElementById('wa-dropzone') as HTMLElement;
  const editorArea = document.getElementById('wa-editor-area') as HTMLElement;
  const changeImgBtn = document.getElementById('wa-change-img-btn') as HTMLButtonElement;
  
  const mainCanvas = document.getElementById('wa-main-canvas') as HTMLCanvasElement;
  const circlePreviewCanvas = document.getElementById('wa-circle-canvas') as HTMLCanvasElement;
  const ctx = mainCanvas ? mainCanvas.getContext('2d') : null;
  const circleCtx = circlePreviewCanvas ? circlePreviewCanvas.getContext('2d') : null;

  const fitModeBtns = document.querySelectorAll<HTMLButtonElement>('.wa-mode-btn');
  const bgControls = document.getElementById('wa-bg-controls') as HTMLElement;
  const bgTypeBtns = document.querySelectorAll<HTMLButtonElement>('.wa-bg-btn');
  const blurGroup = document.getElementById('wa-blur-group') as HTMLElement;
  const blurInput = document.getElementById('wa-blur-input') as HTMLInputElement;

  const colorGroup = document.getElementById('wa-color-group') as HTMLElement;
  const colorBtns = document.querySelectorAll<HTMLButtonElement>('.wa-color-pill');
  const customColorInput = document.getElementById('wa-custom-color') as HTMLInputElement;

  const zoomInput = document.getElementById('wa-zoom-input') as HTMLInputElement;
  const presetBtns = document.querySelectorAll<HTMLButtonElement>('.wa-preset-btn');
  const formatSelect = document.getElementById('wa-format-select') as HTMLSelectElement;
  const downloadBtn = document.getElementById('wa-download-btn') as HTMLButtonElement;

  if (!fileInput || !mainCanvas || !ctx) return;

  // State variables
  let loadedImage: HTMLImageElement | null = null;
  let mode: 'fit' | 'fill' = 'fit';
  let bgType: 'blur' | 'solid' = 'blur';
  let bgColor = '#ffffff';
  let blurStrength = 20;
  let zoom = 1.0;
  let offsetX = 0; // Normalized -1 to 1
  let offsetY = 0; // Normalized -1 to 1
  let outputSize = 800; // 500, 800, 1000
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialOffsetX = 0;
  let initialOffsetY = 0;

  // Event Listeners for Upload
  dropzone?.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) handleImageUpload(file);
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
    if (file) handleImageUpload(file);
  });

  changeImgBtn?.addEventListener('click', () => fileInput.click());

  function handleImageUpload(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        loadedImage = img;
        offsetX = 0;
        offsetY = 0;
        zoom = 1.0;
        if (zoomInput) zoomInput.value = '1.0';
        
        dropzone.hidden = true;
        editorArea.hidden = false;
        render();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  // Framing Mode (Fit vs Fill)
  fitModeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      fitModeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      mode = btn.dataset.mode as 'fit' | 'fill';
      
      if (bgControls) {
        bgControls.hidden = mode !== 'fit';
      }
      render();
    });
  });

  // Background Type (Blur vs Solid)
  bgTypeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      bgTypeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      bgType = btn.dataset.bg as 'blur' | 'solid';

      if (blurGroup) blurGroup.hidden = bgType !== 'blur';
      if (colorGroup) colorGroup.hidden = bgType !== 'solid';
      render();
    });
  });

  // Blur Strength
  blurInput?.addEventListener('input', () => {
    blurStrength = parseInt(blurInput.value, 10);
    render();
  });

  // Color Pills
  colorBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      bgColor = btn.dataset.color || '#ffffff';
      if (customColorInput) customColorInput.value = bgColor;
      render();
    });
  });

  customColorInput?.addEventListener('input', () => {
    bgColor = customColorInput.value;
    render();
  });

  // Zoom
  zoomInput?.addEventListener('input', () => {
    zoom = parseFloat(zoomInput.value);
    render();
  });

  // Resolution Presets
  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      presetBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      outputSize = parseInt(btn.dataset.size || '800', 10);
      render();
    });
  });

  // Canvas Mouse & Touch Dragging
  mainCanvas.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', endDrag);

  mainCanvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      startDrag(e.touches[0]);
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1) {
      onDrag(e.touches[0]);
    }
  }, { passive: true });

  window.addEventListener('touchend', endDrag);

  function startDrag(e: MouseEvent | Touch) {
    if (!loadedImage) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialOffsetX = offsetX;
    initialOffsetY = offsetY;
  }

  function onDrag(e: MouseEvent | Touch) {
    if (!isDragging || !loadedImage) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // Convert pixel delta to normalized offset
    const canvasRect = mainCanvas.getBoundingClientRect();
    offsetX = initialOffsetX + (dx / canvasRect.width) * 2;
    offsetY = initialOffsetY + (dy / canvasRect.height) * 2;

    // Clamp offsets
    offsetX = Math.max(-1.5, Math.min(1.5, offsetX));
    offsetY = Math.max(-1.5, Math.min(1.5, offsetY));

    render();
  }

  function endDrag() {
    isDragging = false;
  }

  // Core Render Function
  function render() {
    if (!loadedImage || !ctx || !mainCanvas) return;

    const size = outputSize;
    mainCanvas.width = size;
    mainCanvas.height = size;

    ctx.clearRect(0, 0, size, size);

    if (mode === 'fit') {
      if (bgType === 'blur') {
        // Draw blurred background
        ctx.save();
        ctx.filter = `blur(${blurStrength * (size / 500)}px)`;
        
        // Scale to cover
        const bgScale = Math.max(size / loadedImage.width, size / loadedImage.height);
        const bgW = loadedImage.width * bgScale * 1.1; // slight extra scale to avoid edge artifacting
        const bgH = loadedImage.height * bgScale * 1.1;
        ctx.drawImage(loadedImage, (size - bgW) / 2, (size - bgH) / 2, bgW, bgH);
        
        ctx.restore();

        // Darken overlay for better subject contrast
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, size, size);
      } else {
        // Solid Color
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);
      }

      // Draw Main Image fitted
      const fitScale = Math.min(size / loadedImage.width, size / loadedImage.height) * zoom;
      const w = loadedImage.width * fitScale;
      const h = loadedImage.height * fitScale;
      const x = (size - w) / 2 + (offsetX * size) / 4;
      const y = (size - h) / 2 + (offsetY * size) / 4;

      ctx.drawImage(loadedImage, x, y, w, h);
    } else {
      // Fill / Crop mode
      const fillScale = Math.max(size / loadedImage.width, size / loadedImage.height) * zoom;
      const w = loadedImage.width * fillScale;
      const h = loadedImage.height * fillScale;
      const x = (size - w) / 2 + (offsetX * size) / 4;
      const y = (size - h) / 2 + (offsetY * size) / 4;

      ctx.drawImage(loadedImage, x, y, w, h);
    }

    // Update Circle Preview Canvas
    if (circlePreviewCanvas && circleCtx) {
      circlePreviewCanvas.width = 160;
      circlePreviewCanvas.height = 160;
      circleCtx.clearRect(0, 0, 160, 160);

      circleCtx.save();
      circleCtx.beginPath();
      circleCtx.arc(80, 80, 80, 0, Math.PI * 2);
      circleCtx.closePath();
      circleCtx.clip();

      circleCtx.drawImage(mainCanvas, 0, 0, 160, 160);
      circleCtx.restore();
    }
  }

  // Download Handler
  downloadBtn?.addEventListener('click', () => {
    if (!mainCanvas || !loadedImage) return;

    const mimeType = formatSelect?.value || 'image/jpeg';
    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';

    const dataUrl = mainCanvas.toDataURL(mimeType, 0.92);
    const link = document.createElement('a');
    link.download = `whatsapp-dp-${outputSize}x${outputSize}.${ext}`;
    link.href = dataUrl;
    link.click();
  });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWhatsAppResizer);
} else {
  initWhatsAppResizer();
}
