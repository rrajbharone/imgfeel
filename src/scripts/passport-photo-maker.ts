/**
 * passport-photo-maker.ts
 * 100% Client-Side Pure TypeScript Passport Photo Framing, Biometric Overlay,
 * and 300 DPI Printable Multi-Photo Sheet Layout Engine.
 */

export interface PassportPreset {
  id: string;
  name: string;
  country: string;
  widthMm: number;
  heightMm: number;
  widthPx300Dpi: number;
  heightPx300Dpi: number;
  headHeightMinRatio: number; // e.g. 0.70 (70% of total height)
  headHeightMaxRatio: number; // e.g. 0.80 (80% of total height)
  description: string;
}

export interface PaperSizePreset {
  id: string;
  name: string;
  widthInches: number;
  heightInches: number;
  widthPx300Dpi: number;
  heightPx300Dpi: number;
  description: string;
}

export interface PhotoTransform {
  panX: number; // in pixels
  panY: number; // in pixels
  zoom: number; // 0.5 to 3.0
  rotation: number; // in degrees -180 to 180
  flipHorizontal: boolean;
  brightness: number; // 0.5 to 1.5 (default 1.0)
  contrast: number; // 0.5 to 1.5 (default 1.0)
  backgroundColor: 'original' | 'white' | 'offwhite' | 'gray' | 'lightblue';
  showBiometricGuide: boolean;
}

export interface SheetOptions {
  paperSizeId: string;
  copies: number | 'auto';
  showCuttingGuides: boolean;
  marginMm: number;
  gapMm: number;
}

export const PASSPORT_PRESETS: PassportPreset[] = [
  {
    id: 'us-passport',
    name: 'US Passport & Visa (2×2 in)',
    country: 'United States',
    widthMm: 51,
    heightMm: 51,
    widthPx300Dpi: 600,
    heightPx300Dpi: 600,
    headHeightMinRatio: 0.50,
    headHeightMaxRatio: 0.69,
    description: '2×2 inches (51×51 mm), head 1 to 1 3/8 inches from bottom of chin to top of head',
  },
  {
    id: 'uk-eu-schengen',
    name: 'UK, EU & Schengen (35×45 mm)',
    country: 'Europe / UK / Schengen / Australia',
    widthMm: 35,
    heightMm: 45,
    widthPx300Dpi: 413,
    heightPx300Dpi: 531,
    headHeightMinRatio: 0.70,
    headHeightMaxRatio: 0.80,
    description: '35×45 mm, head height 32–36 mm from chin to crown',
  },
  {
    id: 'india-passport',
    name: 'India Passport & Visa (35×45 mm)',
    country: 'India',
    widthMm: 35,
    heightMm: 45,
    widthPx300Dpi: 413,
    heightPx300Dpi: 531,
    headHeightMinRatio: 0.70,
    headHeightMaxRatio: 0.80,
    description: '35×45 mm (or 51×51 mm for OCI / Visa applications)',
  },
  {
    id: 'india-oci-visa',
    name: 'India OCI / Visa / 2×2 in (51×51 mm)',
    country: 'India',
    widthMm: 51,
    heightMm: 51,
    widthPx300Dpi: 600,
    heightPx300Dpi: 600,
    headHeightMinRatio: 0.60,
    headHeightMaxRatio: 0.75,
    description: '51×51 mm square format for Indian Visa and OCI card applications',
  },
  {
    id: 'canada-passport',
    name: 'Canada Passport (50×70 mm)',
    country: 'Canada',
    widthMm: 50,
    heightMm: 70,
    widthPx300Dpi: 591,
    heightPx300Dpi: 827,
    headHeightMinRatio: 0.44,
    headHeightMaxRatio: 0.51,
    description: '50×70 mm, face height 31–36 mm from chin to crown',
  },
  {
    id: 'china-passport',
    name: 'China Passport & Visa (33×48 mm)',
    country: 'China',
    widthMm: 33,
    heightMm: 48,
    widthPx300Dpi: 390,
    heightPx300Dpi: 567,
    headHeightMinRatio: 0.58,
    headHeightMaxRatio: 0.70,
    description: '33×48 mm, head height 28–33 mm, white background',
  },
  {
    id: 'japan-passport',
    name: 'Japan / Singapore / Malaysia (35×45 mm)',
    country: 'Asia',
    widthMm: 35,
    heightMm: 45,
    widthPx300Dpi: 413,
    heightPx300Dpi: 531,
    headHeightMinRatio: 0.70,
    headHeightMaxRatio: 0.80,
    description: '35×45 mm standard official photo size for Asian passports',
  },
  {
    id: 'australia-passport',
    name: 'Australia & New Zealand (35×45 mm)',
    country: 'Oceania',
    widthMm: 35,
    heightMm: 45,
    widthPx300Dpi: 413,
    heightPx300Dpi: 531,
    headHeightMinRatio: 0.71,
    headHeightMaxRatio: 0.78,
    description: '35×45 mm, head size 32 to 36 mm from chin to crown',
  },
  {
    id: 'custom-preset',
    name: 'Custom Dimensions',
    country: 'Custom',
    widthMm: 35,
    heightMm: 45,
    widthPx300Dpi: 413,
    heightPx300Dpi: 531,
    headHeightMinRatio: 0.70,
    headHeightMaxRatio: 0.80,
    description: 'Specify your own custom width and height in mm or pixels',
  },
];

export const PAPER_SIZE_PRESETS: PaperSizePreset[] = [
  {
    id: '4x6-inches',
    name: '4×6 inches (10×15 cm Photo Paper)',
    widthInches: 4,
    heightInches: 6,
    widthPx300Dpi: 1200,
    heightPx300Dpi: 1800,
    description: 'Standard photo paper at drugstores, photo labs, and home photo printers (recommended)',
  },
  {
    id: '5x7-inches',
    name: '5×7 inches (13×18 cm)',
    widthInches: 5,
    heightInches: 7,
    widthPx300Dpi: 1500,
    heightPx300Dpi: 2100,
    description: 'Medium photo paper print size',
  },
  {
    id: 'a4-paper',
    name: 'A4 Paper (210×297 mm)',
    widthInches: 8.27,
    heightInches: 11.69,
    widthPx300Dpi: 2480,
    heightPx300Dpi: 3508,
    description: 'Standard international letter paper size for office and color inkjet printers',
  },
  {
    id: 'us-letter',
    name: 'US Letter (8.5×11 inches)',
    widthInches: 8.5,
    heightInches: 11,
    widthPx300Dpi: 2550,
    heightPx300Dpi: 3300,
    description: 'Standard North American document paper size',
  },
];

export class PassportPhotoEngine {
  /**
   * Render single passport photo onto destination canvas with transforms,
   * background enhancement, filters, and optional biometric overlay.
   */
  public static renderPassportPhoto(
    sourceImg: CanvasImageSource,
    sourceNaturalWidth: number,
    sourceNaturalHeight: number,
    preset: PassportPreset,
    transform: PhotoTransform,
    targetCanvas: HTMLCanvasElement,
    includeBiometricOverlay: boolean = false
  ): void {
    const targetW = preset.widthPx300Dpi;
    const targetH = preset.heightPx300Dpi;

    targetCanvas.width = targetW;
    targetCanvas.height = targetH;
    const ctx = targetCanvas.getContext('2d')!;

    // 1. Clear / Background Fill
    ctx.clearRect(0, 0, targetW, targetH);

    const bgMap: Record<string, string> = {
      white: '#FFFFFF',
      offwhite: '#F9FAFB',
      gray: '#F3F4F6',
      lightblue: '#E0F2FE',
    };

    if (transform.backgroundColor !== 'original' && bgMap[transform.backgroundColor]) {
      ctx.fillStyle = bgMap[transform.backgroundColor];
      ctx.fillRect(0, 0, targetW, targetH);
    }

    // 2. Apply Brightness & Contrast Filters
    ctx.save();
    const brightnessPct = Math.round(transform.brightness * 100);
    const contrastPct = Math.round(transform.contrast * 100);
    ctx.filter = `brightness(${brightnessPct}%) contrast(${contrastPct}%)`;

    // 3. Coordinate Transformation (Center-based)
    ctx.translate(targetW / 2 + transform.panX, targetH / 2 + transform.panY);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    if (transform.flipHorizontal) {
      ctx.scale(-1, 1);
    }

    // Scale so photo covers the target area by default, modified by zoom
    const baseScale = Math.max(targetW / sourceNaturalWidth, targetH / sourceNaturalHeight);
    const finalScale = baseScale * transform.zoom;

    const drawW = sourceNaturalWidth * finalScale;
    const drawH = sourceNaturalHeight * finalScale;

    ctx.drawImage(sourceImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // 4. Optional Biometric Guidelines Overlay (Rendered on Preview Only, not in final export)
    if (includeBiometricOverlay && transform.showBiometricGuide) {
      PassportPhotoEngine.drawBiometricGuide(ctx, targetW, targetH, preset);
    }
  }

  /**
   * Draw official biometric safe zone overlay (Head oval, chin marker, crown marker, eye line)
   */
  public static drawBiometricGuide(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    preset: PassportPreset
  ): void {
    ctx.save();

    const minRatio = preset.headHeightMinRatio;
    const maxRatio = preset.headHeightMaxRatio;
    const avgRatio = (minRatio + maxRatio) / 2;

    const headHeight = height * avgRatio;
    const headWidth = headHeight * 0.72;
    const headCenterY = height * 0.44;
    const headCenterX = width / 2;

    // Outer shading overlay (darkened safe zone outside oval)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
    ctx.fillRect(0, 0, width, height);

    // Cut out clear oval for head placement
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.ellipse(headCenterX, headCenterY, headWidth / 2, headHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Reset composite operation to draw guideline strokes
    ctx.globalCompositeOperation = 'source-over';

    // 1. Head Oval Border
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = Math.max(2, Math.round(width / 300));
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.ellipse(headCenterX, headCenterY, headWidth / 2, headHeight / 2, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Eye Level Line (Approx 45% of head height from top)
    const eyeLevelY = headCenterY - headHeight * 0.08;
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = Math.max(1.5, Math.round(width / 400));
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(headCenterX - headWidth * 0.4, eyeLevelY);
    ctx.lineTo(headCenterX + headWidth * 0.4, eyeLevelY);
    ctx.stroke();

    // 3. Crown Line & Chin Line
    const crownY = headCenterY - headHeight / 2;
    const chinY = headCenterY + headHeight / 2;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 2]);

    // Crown mark
    ctx.beginPath();
    ctx.moveTo(headCenterX - 30, crownY);
    ctx.lineTo(headCenterX + 30, crownY);
    ctx.stroke();

    // Chin mark
    ctx.beginPath();
    ctx.moveTo(headCenterX - 30, chinY);
    ctx.lineTo(headCenterX + 30, chinY);
    ctx.stroke();

    // 4. Center Vertical Symmetry Line
    ctx.strokeStyle = 'rgba(79, 70, 229, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(headCenterX, crownY - 15);
    ctx.lineTo(headCenterX, chinY + 15);
    ctx.stroke();

    // 5. Guideline Labels
    ctx.setLineDash([]);
    ctx.fillStyle = '#10B981';
    ctx.font = `bold ${Math.max(10, Math.round(width / 45))}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('Eye Level', headCenterX + headWidth * 0.45, eyeLevelY + 3);

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('Crown (Top of Head)', headCenterX, Math.max(16, crownY - 6));
    ctx.fillText('Chin Line', headCenterX, Math.min(height - 8, chinY + 14));

    ctx.restore();
  }

  /**
   * Generate 300 DPI Multi-Copy Printable Photo Sheet
   */
  public static generatePrintableSheet(
    singlePhotoCanvas: HTMLCanvasElement,
    preset: PassportPreset,
    paperPreset: PaperSizePreset,
    sheetCanvas: HTMLCanvasElement,
    options: SheetOptions
  ): { totalCopies: number; rows: number; cols: number } {
    const sheetW = paperPreset.widthPx300Dpi;
    const sheetH = paperPreset.heightPx300Dpi;

    sheetCanvas.width = sheetW;
    sheetCanvas.height = sheetH;
    const ctx = sheetCanvas.getContext('2d')!;

    // 1. Fill Sheet Background (Pure White Photo Paper)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, sheetW, sheetH);

    // 2. Convert margins & gaps to 300 DPI pixels (1 mm = ~11.811 px at 300 DPI)
    const mmToPx = 300 / 25.4;
    const marginPx = Math.round(options.marginMm * mmToPx);
    const gapPx = Math.round(options.gapMm * mmToPx);

    const photoW = preset.widthPx300Dpi;
    const photoH = preset.heightPx300Dpi;

    // 3. Calculate Maximum Grid Rows & Columns
    const availableW = sheetW - (marginPx * 2);
    const availableH = sheetH - (marginPx * 2);

    const maxCols = Math.max(1, Math.floor((availableW + gapPx) / (photoW + gapPx)));
    const maxRows = Math.max(1, Math.floor((availableH + gapPx) / (photoH + gapPx)));
    const maxPossibleCopies = maxCols * maxRows;

    let targetCopies = maxPossibleCopies;
    if (typeof options.copies === 'number') {
      targetCopies = Math.min(options.copies, maxPossibleCopies);
    }

    // Determine actual rows & columns needed for requested copy count
    let cols = maxCols;
    let rows = Math.ceil(targetCopies / cols);
    if (targetCopies < cols) {
      cols = targetCopies;
      rows = 1;
    }

    // 4. Center the grid on the printable sheet
    const totalGridW = (cols * photoW) + ((cols - 1) * gapPx);
    const totalGridH = (rows * photoH) + ((rows - 1) * gapPx);

    const startX = Math.round((sheetW - totalGridW) / 2);
    const startY = Math.round((sheetH - totalGridH) / 2);

    // 5. Draw Individual Photos & Cutting Guides
    let drawnCopies = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (drawnCopies >= targetCopies) break;

        const posX = startX + c * (photoW + gapPx);
        const posY = startY + r * (photoH + gapPx);

        // Draw Passport Photo
        ctx.drawImage(singlePhotoCanvas, posX, posY, photoW, photoH);

        // Draw Optional Cutting Guides (Thin clean line around each photo or corner marks)
        if (options.showCuttingGuides) {
          ctx.save();
          ctx.strokeStyle = '#D1D5DB'; // Subtle light gray cutting border
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(posX - 0.5, posY - 0.5, photoW + 1, photoH + 1);

          // Corner crosshair markers extending into the gap/margin
          ctx.strokeStyle = '#9CA3AF';
          ctx.setLineDash([]);
          const crosshairLen = Math.round(3 * mmToPx);

          // Top-left
          ctx.beginPath();
          ctx.moveTo(posX - crosshairLen, posY);
          ctx.lineTo(posX, posY);
          ctx.moveTo(posX, posY - crosshairLen);
          ctx.lineTo(posX, posY);
          ctx.stroke();

          // Top-right
          ctx.beginPath();
          ctx.moveTo(posX + photoW, posY);
          ctx.lineTo(posX + photoW + crosshairLen, posY);
          ctx.moveTo(posX + photoW, posY - crosshairLen);
          ctx.lineTo(posX + photoW, posY);
          ctx.stroke();

          // Bottom-left
          ctx.beginPath();
          ctx.moveTo(posX - crosshairLen, posY + photoH);
          ctx.lineTo(posX, posY + photoH);
          ctx.moveTo(posX, posY + photoH);
          ctx.lineTo(posX, posY + photoH + crosshairLen);
          ctx.stroke();

          // Bottom-right
          ctx.beginPath();
          ctx.moveTo(posX + photoW, posY + photoH);
          ctx.lineTo(posX + photoW + crosshairLen, posY + photoH);
          ctx.moveTo(posX + photoW, posY + photoH);
          ctx.lineTo(posX + photoW, posY + photoH + crosshairLen);
          ctx.stroke();

          ctx.restore();
        }

        drawnCopies++;
      }
    }

    // 6. Draw Subtle Bottom Footer Tag with Paper Size & Resolution
    ctx.save();
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `ImgFeel.com — ${drawnCopies} Passport Photos (${preset.name}) | ${paperPreset.name} @ 300 DPI`,
      sheetW / 2,
      sheetH - 18
    );
    ctx.restore();

    return { totalCopies: drawnCopies, rows, cols };
  }

  /**
   * Generate an in-memory realistic sample portrait for 1-click testing
   */
  public static async generateSamplePortrait(): Promise<{ file: File; dataUrl: string }> {
    const width = 800;
    const height = 1000;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // 1. Studio Lighting Background (Clean gradient)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#FFFFFF');
    bgGradient.addColorStop(1, '#F1F5F9');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Torso / Professional Suit & Shirt
    // Shoulders
    ctx.fillStyle = '#1E293B'; // Navy Blue Suit
    ctx.beginPath();
    ctx.moveTo(width / 2 - 280, height);
    ctx.quadraticCurveTo(width / 2 - 240, height - 320, width / 2 - 120, height - 350);
    ctx.lineTo(width / 2 + 120, height - 350);
    ctx.quadraticCurveTo(width / 2 + 240, height - 320, width / 2 + 280, height);
    ctx.closePath();
    ctx.fill();

    // White Collar / Shirt
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(width / 2 - 70, height - 350);
    ctx.lineTo(width / 2, height - 220);
    ctx.lineTo(width / 2 + 70, height - 350);
    ctx.closePath();
    ctx.fill();

    // Neck
    ctx.fillStyle = '#F5D0C5';
    ctx.beginPath();
    ctx.moveTo(width / 2 - 60, height - 420);
    ctx.lineTo(width / 2 - 50, height - 310);
    ctx.lineTo(width / 2 + 50, height - 310);
    ctx.lineTo(width / 2 + 60, height - 420);
    ctx.closePath();
    ctx.fill();

    // 3. Head & Face
    const faceCenterX = width / 2;
    const faceCenterY = height * 0.42;

    // Face Oval
    ctx.fillStyle = '#FFE0D6';
    ctx.beginPath();
    ctx.ellipse(faceCenterX, faceCenterY, 130, 170, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#2B1B17'; // Dark brown
    ctx.beginPath();
    ctx.arc(faceCenterX, faceCenterY - 40, 140, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();

    // Eyes
    const eyeY = faceCenterY - 15;
    ctx.fillStyle = '#FFFFFF';
    // Left eye
    ctx.beginPath();
    ctx.ellipse(faceCenterX - 45, eyeY, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Right eye
    ctx.beginPath();
    ctx.ellipse(faceCenterX + 45, eyeY, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Irises
    ctx.fillStyle = '#3B2F2F';
    ctx.beginPath();
    ctx.arc(faceCenterX - 45, eyeY, 8, 0, Math.PI * 2);
    ctx.arc(faceCenterX + 45, eyeY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Eyebrows
    ctx.strokeStyle = '#2B1B17';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(faceCenterX - 45, eyeY - 20, 22, Math.PI * 1.1, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(faceCenterX + 45, eyeY - 20, 22, Math.PI * 1.15, Math.PI * 1.9);
    ctx.stroke();

    // Nose
    ctx.strokeStyle = '#D9A596';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(faceCenterX, eyeY + 5);
    ctx.lineTo(faceCenterX + 6, eyeY + 50);
    ctx.lineTo(faceCenterX - 6, eyeY + 55);
    ctx.stroke();

    // Neutral Mouth (Passport requirement: neutral expression)
    ctx.strokeStyle = '#C27C72';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(faceCenterX - 30, faceCenterY + 90);
    ctx.lineTo(faceCenterX + 30, faceCenterY + 90);
    ctx.stroke();

    // Subtle lighting & ears
    ctx.fillStyle = '#F5D0C5';
    ctx.beginPath();
    ctx.ellipse(faceCenterX - 130, faceCenterY + 5, 14, 30, 0, 0, Math.PI * 2);
    ctx.ellipse(faceCenterX + 130, faceCenterY + 5, 14, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95));
    const file = new File([blob], 'sample-passport-portrait.jpg', { type: 'image/jpeg' });
    const dataUrl = URL.createObjectURL(blob);

    return { file, dataUrl };
  }
}
