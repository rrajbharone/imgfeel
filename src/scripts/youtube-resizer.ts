/**
 * YouTube Banner Resizer Client Engine
 * 100% Client-Side Canvas Processing
 */

export function initYouTubeResizer() {
  const container = document.getElementById('yt-resizer-container');
  if (!container) return;

  const fileInput = document.getElementById('yt-file-input') as HTMLInputElement;
  const dropzone = document.getElementById('yt-dropzone') as HTMLElement;
  const editorArea = document.getElementById('yt-editor-area') as HTMLElement;
  const changeImgBtn = document.getElementById('yt-change-img-btn') as HTMLButtonElement;

  const mainCanvas = document.getElementById('yt-main-canvas') as HTMLCanvasElement;
  const ctx = mainCanvas ? mainCanvas.getContext('2d') : null;

  const viewModeBtns = document.querySelectorAll<HTMLButtonElement>('.yt-view-btn');
  const safeOverlay = document.getElementById('yt-safe-overlay') as HTMLElement;

  const bgTypeBtns = document.querySelectorAll<HTMLButtonElement>('.yt-bg-btn');
  const colorGroup = document.getElementById('yt-color-group') as HTMLElement;
  const colorBtns = document.querySelectorAll<HTMLButtonElement>('.yt-color-pill');
  const customColorInput = document.getElementById('yt-custom-color') as HTMLInputElement;

  const zoomInput = document.getElementById('yt-zoom-input') as HTMLInputElement;
  const formatSelect = document.getElementById('yt-format-select') as HTMLSelectElement;
  const downloadBtn = document.getElementById('yt-download-btn') as HTMLButtonElement;

  if (!fileInput || !mainCanvas || !ctx) return;

  // State
  let loadedImage: HTMLImageElement | null = null;
  let viewMode: 'all' | 'desktop' | 'mobile' | 'tv' = 'all';
  let bgType: 'blur' | 'solid' = 'blur';
  let bgColor = '#1f2937';
  let zoom = 1.0;
  let offsetX = 0; // Normalized -1.5 to 1.5
  let offsetY = 0; // Normalized -1.5 to 1.5
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialOffsetX = 0;
  let initialOffsetY = 0;

  // Upload Event Listeners
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

  // Device View Mode Switcher
  viewModeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      viewModeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      viewMode = (btn.dataset.view as 'all' | 'desktop' | 'mobile' | 'tv') || 'all';

      if (safeOverlay) {
        safeOverlay.className = `safe-overlay mode-${viewMode}`;
      }
      render();
    });
  });

  // Background Options (Blur vs Solid Color)
  bgTypeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      bgTypeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      bgType = (btn.dataset.bg as 'blur' | 'solid') || 'blur';

      if (colorGroup) colorGroup.hidden = bgType !== 'solid';
      render();
    });
  });

  colorBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      bgColor = btn.dataset.color || '#1f2937';
      if (customColorInput) customColorInput.value = bgColor;
      render();
    });
  });

  customColorInput?.addEventListener('input', () => {
    bgColor = customColorInput.value;
    render();
  });

  // Zoom Slider
  zoomInput?.addEventListener('input', () => {
    zoom = parseFloat(zoomInput.value);
    render();
  });

  // Mouse & Touch Dragging
  mainCanvas.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', endDrag);

  mainCanvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) startDrag(e.touches[0]);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1) onDrag(e.touches[0]);
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
    if (!isDragging || !loadedImage || !mainCanvas) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const rect = mainCanvas.getBoundingClientRect();
    offsetX = initialOffsetX + (dx / rect.width) * 2;
    offsetY = initialOffsetY + (dy / rect.height) * 2;

    // Clamp offset bounds
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

    // Official YouTube Banner Dimensions
    const targetW = 2560;
    const targetH = 1440;

    mainCanvas.width = targetW;
    mainCanvas.height = targetH;
    ctx.clearRect(0, 0, targetW, targetH);

    // Background Rendering
    if (bgType === 'blur') {
      ctx.save();
      ctx.filter = 'blur(60px)';
      const bgScale = Math.max(targetW / loadedImage.width, targetH / loadedImage.height) * 1.1;
      const bgW = loadedImage.width * bgScale;
      const bgH = loadedImage.height * bgScale;
      ctx.drawImage(loadedImage, (targetW - bgW) / 2, (targetH - bgH) / 2, bgW, bgH);
      ctx.restore();

      // Subtle dark overlay to improve main subject contrast
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, targetW, targetH);
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, targetW, targetH);
    }

    // Main Image Drawing with aspect fill + zoom + offset
    const scale = Math.max(targetW / loadedImage.width, targetH / loadedImage.height) * zoom;
    const drawW = loadedImage.width * scale;
    const drawH = loadedImage.height * scale;
    const drawX = (targetW - drawW) / 2 + (offsetX * targetW) / 4;
    const drawY = (targetH - drawH) / 2 + (offsetY * targetH) / 4;

    ctx.drawImage(loadedImage, drawX, drawY, drawW, drawH);
  }

  // Download Handler
  downloadBtn?.addEventListener('click', () => {
    if (!mainCanvas || !loadedImage) return;

    const mimeType = formatSelect?.value || 'image/jpeg';
    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';

    const dataUrl = mainCanvas.toDataURL(mimeType, 0.92);
    const link = document.createElement('a');
    link.download = `youtube-banner-2560x1440.${ext}`;
    link.href = dataUrl;
    link.click();
  });
}

// Auto-initialize DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initYouTubeResizer);
} else {
  initYouTubeResizer();
}
