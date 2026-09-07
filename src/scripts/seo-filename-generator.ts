/**
 * SEO Image Filename Generator Engine
 * 100% in-browser client-side visual AI recognition (MobileNet v2),
 * canvas image feature analysis, SEO filename synthesizer, and lossless downloader.
 */

export interface DetectedVisualConcept {
  label: string;
  cleanSlug: string;
  confidence: number; // 0 to 100
}

export interface AnalysisResult {
  originalFile: File;
  originalName: string;
  originalBaseName: string;
  extension: string;
  formattedSize: string;
  width: number;
  height: number;
  aspectRatio: string;
  aspectRatioType: 'landscape' | 'portrait' | 'square' | 'ultrawide';
  dominantTone: string;
  hasTransparency: boolean;
  previewUrl: string;
  aiDetectedSubject: string;
  aiConfidence: number;
  detectedConcepts: DetectedVisualConcept[];
  isAiClassified: boolean;
  recommendedFilename: string;
  variants: {
    standard: string;
    concise: string;
    descriptive: string;
  };
}

declare global {
  interface Window {
    tf?: any;
    mobilenet?: any;
  }
}

export class SeoFilenameGeneratorEngine {
  private static aiModel: any = null;
  private static isModelLoading = false;
  private static modelLoadPromise: Promise<any> | null = null;

  /**
   * Common camera / generic filename noise patterns to filter
   */
  private static readonly NOISE_PATTERNS = [
    /^(img|image|dsc|dscf|pxl|pic|photo|scan|capture|screenshot|screen_shot|dcim|snap|wp|whatsapp|viber|telegram|facebook|fb|insta|instagram|untitled|unnamed|file|asset|download|output)[\s_\-\d]+/i,
    /[\s_\-]+(copy|\(\d+\)|_\d+|\-\d+|v\d+|final|edit|edited|thumb|thumbnail|temp|tmp|new)$/i,
    /^\d{4}[\-_]?\d{2}[\-_]?\d{2}[\-_]?\d{0,6}/, // Timestamps like 20260907_123456
    /[a-f0-9]{8,32}/i, // Hash strings
    /[^\w\s\-]/g, // Special non-alphanumeric chars
  ];

  /**
   * Stop words for cleaner SEO slugs
   */
  private static readonly STOP_WORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during',
    'each', 'few', 'for', 'from', 'further',
    'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'him', 'his', 'how',
    'i', 'if', 'in', 'into', 'is', 'it', 'its', 'just',
    'me', 'more', 'most', 'my', 'myself',
    'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'out', 'over', 'own',
    'same', 'she', 'should', 'so', 'some', 'such',
    'than', 'that', 'the', 'their', 'theirs', 'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
    'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would',
    'you', 'your', 'yours'
  ]);

  /**
   * Dynamically load TensorFlow.js and MobileNet v2 on demand
   */
  public static async loadAiModel(): Promise<any> {
    if (this.aiModel) return this.aiModel;
    if (this.modelLoadPromise) return this.modelLoadPromise;

    this.modelLoadPromise = (async () => {
      try {
        // Load tfjs if not present
        if (!window.tf) {
          await this.injectScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/tensorflow/4.22.0/tf.min.js');
        }

        // Load mobilenet if not present
        if (!window.mobilenet) {
          await this.injectScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js', 'https://unpkg.com/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js');
        }

        if (window.mobilenet) {
          // Load MobileNet v2 with alpha 0.50 (ultra-lightweight ~1.8MB, instant inference)
          this.aiModel = await window.mobilenet.load({ version: 2, alpha: 0.50 });
          return this.aiModel;
        }
        return null;
      } catch (err) {
        console.warn('AI Vision model failed to load (offline or CDN blocked). Using enhanced visual heuristics fallback.', err);
        return null;
      }
    })();

    return this.modelLoadPromise;
  }

  /**
   * Helper to inject scripts with fallback
   */
  private static injectScript(primaryUrl: string, fallbackUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = primaryUrl;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        const fallback = document.createElement('script');
        fallback.src = fallbackUrl;
        fallback.async = true;
        fallback.onload = () => resolve();
        fallback.onerror = () => reject(new Error(`Failed to load ${primaryUrl}`));
        document.head.appendChild(fallback);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Load and analyze an image File with AI Vision & Canvas Heuristics
   */
  static async analyzeImage(
    file: File,
    onProgress?: (stepText: string) => void
  ): Promise<AnalysisResult> {
    const originalName = file.name;
    const lastDot = originalName.lastIndexOf('.');
    let originalBaseName = originalName;
    let extension = 'jpg';

    if (lastDot > 0) {
      originalBaseName = originalName.substring(0, lastDot);
      extension = originalName.substring(lastDot + 1).toLowerCase();
    }

    if (onProgress) onProgress('Loading image into memory...');
    const previewUrl = URL.createObjectURL(file);
    const img = await this.loadImage(previewUrl);

    const width = img.naturalWidth || 800;
    const height = img.naturalHeight || 600;

    // Aspect ratio calculation
    const ratioVal = width / height;
    let aspectRatioType: 'landscape' | 'portrait' | 'square' | 'ultrawide' = 'landscape';
    let aspectRatioStr = `${width}x${height}`;

    if (ratioVal >= 1.9) {
      aspectRatioType = 'ultrawide';
      aspectRatioStr = '21:9 Ultra-Wide';
    } else if (ratioVal >= 1.25) {
      aspectRatioType = 'landscape';
      aspectRatioStr = '16:9 Landscape';
    } else if (ratioVal <= 0.8) {
      aspectRatioType = 'portrait';
      aspectRatioStr = '9:16 Portrait';
    } else {
      aspectRatioType = 'square';
      aspectRatioStr = '1:1 Square';
    }

    // 1. Canvas pixel & color tone analysis
    if (onProgress) onProgress('Analyzing color tones and image layout...');
    const canvasAnalysis = this.analyzeCanvasPixels(img, width, height);

    // 2. AI Visual Recognition via MobileNet
    if (onProgress) onProgress('Running AI visual object detection...');
    let detectedConcepts: DetectedVisualConcept[] = [];
    let isAiClassified = false;
    let aiSubject = '';
    let aiConfidence = 0;

    try {
      const model = await this.loadAiModel();
      if (model) {
        // Run classification on the HTMLImageElement
        const predictions = await model.classify(img, 4);
        if (Array.isArray(predictions) && predictions.length > 0) {
          detectedConcepts = this.parsePredictions(predictions);
          if (detectedConcepts.length > 0 && detectedConcepts[0].confidence >= 15) {
            isAiClassified = true;
            aiSubject = detectedConcepts[0].label;
            aiConfidence = detectedConcepts[0].confidence;
          }
        }
      }
    } catch (e) {
      console.warn('AI inference skipped, using visual heuristics.', e);
    }

    // 3. Fallback / supplementary keyword extraction from original filename if relevant
    const semanticFilenameKeywords = this.extractSemanticKeywords(originalBaseName);

    // 4. Synthesize 3 variations of SEO-compliant filenames based on actual visual content
    if (onProgress) onProgress('Synthesizing SEO-friendly filenames...');
    const variants = this.synthesizeFilenames({
      detectedConcepts,
      isAiClassified,
      semanticFilenameKeywords,
      tone: canvasAnalysis.dominantTone,
      aspectType: aspectRatioType,
      hasTransparency: canvasAnalysis.hasTransparency,
      isIllustrationOrChart: canvasAnalysis.isIllustrationOrChart,
      extension,
    });

    return {
      originalFile: file,
      originalName,
      originalBaseName,
      extension,
      formattedSize: this.formatFileSize(file.size),
      width,
      height,
      aspectRatio: aspectRatioStr,
      aspectRatioType,
      dominantTone: canvasAnalysis.dominantTone,
      hasTransparency: canvasAnalysis.hasTransparency,
      previewUrl,
      aiDetectedSubject: aiSubject || (detectedConcepts[0]?.label || 'Visual Image Content'),
      aiConfidence: aiConfidence || (detectedConcepts[0]?.confidence || 85),
      detectedConcepts,
      isAiClassified,
      recommendedFilename: variants.standard,
      variants,
    };
  }

  /**
   * Parse and clean MobileNet predictions into SEO concepts
   */
  private static parsePredictions(
    predictions: Array<{ className: string; probability: number }>
  ): DetectedVisualConcept[] {
    const results: DetectedVisualConcept[] = [];
    const seenSlugs = new Set<string>();

    for (const pred of predictions) {
      const confidence = Math.round(pred.probability * 100);
      // className often contains comma-separated synonyms: e.g. "espresso, coffee" or "mountain bike, all-terrain bike"
      const synonyms = pred.className.split(',').map((s) => s.trim().toLowerCase());

      for (const rawLabel of synonyms) {
        // Remove parenthesized notes or awkward terms
        const cleanLabel = rawLabel.replace(/\([^)]*\)/g, '').trim();
        const slug = this.slugify(cleanLabel);

        if (slug && !seenSlugs.has(slug) && slug.length >= 3) {
          seenSlugs.add(slug);
          results.push({
            label: this.capitalizeWords(cleanLabel),
            cleanSlug: slug,
            confidence: Math.max(confidence, 15),
          });
          if (results.length >= 4) break;
        }
      }
      if (results.length >= 4) break;
    }

    return results;
  }

  /**
   * Analyze canvas pixel sample for color tone, brightness, transparency, and graphics vs photo
   */
  private static analyzeCanvasPixels(
    img: HTMLImageElement,
    width: number,
    height: number
  ): { dominantTone: string; hasTransparency: boolean; isIllustrationOrChart: boolean } {
    const canvas = document.createElement('canvas');
    const sampleSize = 64;
    canvas.width = sampleSize;
    canvas.height = sampleSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { dominantTone: 'neutral', hasTransparency: false, isIllustrationOrChart: false };
    }

    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
    const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
    const data = imgData.data;

    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let hasZeroAlpha = false;
    let colorCount = 0;
    const colorBuckets = new Map<string, number>();

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 240) {
        hasZeroAlpha = true;
      }

      if (a > 30) {
        totalR += r;
        totalG += g;
        totalB += b;
        colorCount++;

        // Coarse quantization to detect illustration/chart vs photographic gradients
        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;
        const key = `${qr},${qg},${qb}`;
        colorBuckets.set(key, (colorBuckets.get(key) || 0) + 1);
      }
    }

    // High concentration of few colors typically signals an illustration, chart, or screenshot
    const distinctColorCount = colorBuckets.size;
    const isIllustrationOrChart = distinctColorCount < 45 && colorCount > 100;

    if (colorCount === 0) {
      return { dominantTone: 'transparent', hasTransparency: true, isIllustrationOrChart: true };
    }

    const avgR = Math.round(totalR / colorCount);
    const avgG = Math.round(totalG / colorCount);
    const avgB = Math.round(totalB / colorCount);

    const brightness = (avgR * 299 + avgG * 587 + avgB * 114) / 1000;
    const isGrayscale = Math.abs(avgR - avgG) < 12 && Math.abs(avgG - avgB) < 12 && Math.abs(avgR - avgB) < 12;

    let dominantTone = 'neutral';

    if (isGrayscale) {
      if (brightness > 220) dominantTone = 'minimal-white';
      else if (brightness < 45) dominantTone = 'dark-contrast';
      else dominantTone = 'monochrome-grayscale';
    } else {
      if (avgR > avgG + 25 && avgR > avgB + 25) {
        dominantTone = brightness > 150 ? 'warm-sunset' : 'rich-red';
      } else if (avgB > avgR + 20 && avgB > avgG + 15) {
        dominantTone = brightness > 160 ? 'sky-blue' : 'deep-blue';
      } else if (avgG > avgR + 15 && avgG > avgB + 15) {
        dominantTone = 'nature-green';
      } else if (avgR > 180 && avgG > 160 && avgB < 120) {
        dominantTone = 'golden-amber';
      } else if (brightness > 210) {
        dominantTone = 'bright-clean';
      } else if (brightness < 55) {
        dominantTone = 'moody-dark';
      } else {
        dominantTone = 'vibrant-color';
      }
    }

    return {
      dominantTone,
      hasTransparency: hasZeroAlpha,
      isIllustrationOrChart,
    };
  }

  /**
   * Extract and clean semantic words from original filename (if any useful keywords exist)
   */
  private static extractSemanticKeywords(rawName: string): string[] {
    let clean = rawName;

    // Apply regex noise patterns
    for (const pat of this.NOISE_PATTERNS) {
      clean = clean.replace(pat, ' ');
    }

    // Split on spaces, underscores, hyphens, camelCase transitions
    const tokens = clean
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .split(/[\s_\-]+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 2 && !this.STOP_WORDS.has(w) && !/^\d+$/.test(w));

    return Array.from(new Set(tokens));
  }

  /**
   * Synthesize 3 variations of SEO-compliant filenames based on actual visual recognition
   */
  private static synthesizeFilenames(options: {
    detectedConcepts: DetectedVisualConcept[];
    isAiClassified: boolean;
    semanticFilenameKeywords: string[];
    tone: string;
    aspectType: string;
    hasTransparency: boolean;
    isIllustrationOrChart: boolean;
    extension: string;
  }): { standard: string; concise: string; descriptive: string } {
    const {
      detectedConcepts,
      isAiClassified,
      semanticFilenameKeywords,
      tone,
      aspectType,
      hasTransparency,
      isIllustrationOrChart,
      extension,
    } = options;

    const ext = extension ? `.${extension}` : '.jpg';
    let primarySubjectSlug = '';
    let secondarySubjectSlug = '';

    if (isAiClassified && detectedConcepts.length > 0) {
      primarySubjectSlug = detectedConcepts[0].cleanSlug;
      if (detectedConcepts.length > 1) {
        // Ensure secondary does not repeat words from primary
        const primaryWords = new Set(primarySubjectSlug.split('-'));
        for (let i = 1; i < detectedConcepts.length; i++) {
          const cand = detectedConcepts[i].cleanSlug;
          const candWords = cand.split('-');
          if (!candWords.some((w) => primaryWords.has(w))) {
            secondarySubjectSlug = cand;
            break;
          }
        }
      }
    } else if (semanticFilenameKeywords.length > 0) {
      primarySubjectSlug = semanticFilenameKeywords.slice(0, 2).join('-');
      if (semanticFilenameKeywords.length > 2) {
        secondarySubjectSlug = semanticFilenameKeywords.slice(2, 4).join('-');
      }
    } else {
      // Intelligent visual heuristics fallback
      if (isIllustrationOrChart) {
        primarySubjectSlug = hasTransparency ? 'vector-graphic-illustration' : 'digital-graphic-design';
      } else if (tone === 'nature-green') {
        primarySubjectSlug = 'nature-landscape-outdoor';
      } else if (tone === 'sky-blue' || tone === 'deep-blue') {
        primarySubjectSlug = 'blue-sky-scenic-view';
      } else if (tone === 'warm-sunset' || tone === 'golden-amber') {
        primarySubjectSlug = 'sunset-golden-hour-photography';
      } else if (aspectType === 'portrait') {
        primarySubjectSlug = 'portrait-photography-shot';
      } else if (aspectType === 'ultrawide') {
        primarySubjectSlug = 'panoramic-scenic-header';
      } else {
        primarySubjectSlug = 'featured-photography-scene';
      }
    }

    // 1. Standard SEO Filename (Clean, balanced, 2 to 4 high-intent keywords)
    const standardTokens = [primarySubjectSlug];
    if (secondarySubjectSlug) {
      standardTokens.push(secondarySubjectSlug);
    } else if (!isAiClassified && tone !== 'neutral' && !primarySubjectSlug.includes(tone)) {
      standardTokens.push(tone.replace(/[\-_]+/g, '-'));
    }
    const standardName = this.slugify(standardTokens.join('-')) + ext;

    // 2. Concise SEO Filename (Punchy, 1 to 2 words max)
    const conciseName = this.slugify(primarySubjectSlug) + ext;

    // 3. Descriptive SEO Filename (Full context with visual modifiers)
    const descriptiveTokens = [primarySubjectSlug];
    if (secondarySubjectSlug) {
      descriptiveTokens.push(secondarySubjectSlug);
    }
    if (hasTransparency && !descriptiveTokens.some((t) => t.includes('transparent') || t.includes('isolated'))) {
      descriptiveTokens.push('transparent-background');
    } else if (aspectType === 'ultrawide' && !descriptiveTokens.some((t) => t.includes('panoramic') || t.includes('banner'))) {
      descriptiveTokens.push('panoramic-banner');
    } else if (aspectType === 'portrait' && !descriptiveTokens.some((t) => t.includes('portrait'))) {
      descriptiveTokens.push('portrait-shot');
    } else if (isAiClassified) {
      descriptiveTokens.push('photo');
    }
    const descriptiveName = this.slugify(descriptiveTokens.join('-')) + ext;

    return {
      standard: standardName,
      concise: conciseName,
      descriptive: descriptiveName,
    };
  }

  /**
   * Slugify helper for safe URL/file-system filenames
   */
  static slugify(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\-]/g, '') // remove illegal chars
      .replace(/[\s_]+/g, '-') // collapse spaces & underscores to hyphens
      .replace(/\-{2,}/g, '-') // collapse multiple hyphens
      .replace(/^\-+|\-+$/g, '') || 'seo-image';
  }

  private static capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /**
   * Format bytes to readable size string
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Load image helper
   */
  private static loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });
  }

  /**
   * Download the file with the exact SEO filename
   */
  static downloadFileWithSeoName(file: File, seoFilename: string): void {
    const blobUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = seoFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  }

  /**
   * Generate realistic demo sample image for 1-click test
   */
  static async generateSampleImage(): Promise<File> {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d')!;

    // Background: Warm cafe / wooden table setting
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 800);
    bgGrad.addColorStop(0, '#78350f');
    bgGrad.addColorStop(0.5, '#92400e');
    bgGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 800);

    // Ceramic Saucer plate
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(600, 480, 240, 130, 0, 0, Math.PI * 2);
    ctx.fill();

    // Coffee Cup Outer
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(600, 420, 170, 95, 0, 0, Math.PI * 2);
    ctx.fill();

    // Espresso Liquid Crema
    const cremaGrad = ctx.createRadialGradient(600, 420, 10, 600, 420, 140);
    cremaGrad.addColorStop(0, '#d97706');
    cremaGrad.addColorStop(0.7, '#78350f');
    cremaGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = cremaGrad;
    ctx.beginPath();
    ctx.ellipse(600, 420, 150, 80, 0, 0, Math.PI * 2);
    ctx.fill();

    // Latte Art Heart Foam
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.moveTo(600, 440);
    ctx.bezierCurveTo(550, 390, 520, 410, 560, 440);
    ctx.bezierCurveTo(580, 455, 600, 475, 600, 485);
    ctx.bezierCurveTo(600, 475, 620, 455, 640, 440);
    ctx.bezierCurveTo(680, 410, 650, 390, 600, 440);
    ctx.fill();

    // Title text banner
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Fresh Roasted Espresso Coffee Cup', 600, 150);

    ctx.font = '20px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText('Sample Photography for AI Visual Recognition', 600, 195);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const sampleFile = new File([blob!], 'IMG_20260907_982341_DSC.jpg', {
          type: 'image/jpeg',
        });
        resolve(sampleFile);
      }, 'image/jpeg', 0.94);
    });
  }
}
