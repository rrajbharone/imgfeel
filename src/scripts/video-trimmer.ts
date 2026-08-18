/**
 * Video Trimmer Engine for ImgFeel.com
 * 100% Client-Side In-Browser Video Processing & Trimming
 */

export interface VideoMetadata {
  file: File;
  name: string;
  size: number;
  sizeFormatted: string;
  type: string;
  duration: number; // in seconds
  durationFormatted: string;
  width: number;
  height: number;
  aspectRatio: string;
  aspectRatioDecimal: string;
  url: string;
}

export interface TrimOptions {
  startTime: number; // in seconds
  endTime: number; // in seconds
  keepAudio: boolean;
  outputFormat: 'mp4' | 'webm';
  onProgress?: (percent: number, currentTime: number) => void;
}

export interface TrimResult {
  blob: Blob;
  url: string;
  size: number;
  sizeFormatted: string;
  duration: number;
  durationFormatted: string;
  format: string;
}

/**
 * Format bytes to readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format seconds to HH:MM:SS.mmm or MM:SS.m
 */
export function formatTimecode(seconds: number, includeMs = true): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const mStr = String(mins).padStart(2, '0');
  const sStr = String(secs).padStart(2, '0');
  const msStr = String(ms).padStart(3, '0');

  if (hrs > 0) {
    const hStr = String(hrs).padStart(2, '0');
    return includeMs ? `${hStr}:${mStr}:${sStr}.${msStr}` : `${hStr}:${mStr}:${sStr}`;
  }
  return includeMs ? `${mStr}:${sStr}.${msStr}` : `${mStr}:${sStr}`;
}

/**
 * Parse timecode string "HH:MM:SS.mmm" or "MM:SS.mmm" or "SS.mmm" back to seconds
 */
export function parseTimecode(tc: string): number {
  if (!tc) return 0;
  const parts = tc.trim().split(':');
  if (parts.length === 3) {
    const h = parseFloat(parts[0]) || 0;
    const m = parseFloat(parts[1]) || 0;
    const s = parseFloat(parts[2]) || 0;
    return Math.max(0, h * 3600 + m * 60 + s);
  } else if (parts.length === 2) {
    const m = parseFloat(parts[0]) || 0;
    const s = parseFloat(parts[1]) || 0;
    return Math.max(0, m * 60 + s);
  } else if (parts.length === 1) {
    return Math.max(0, parseFloat(parts[0]) || 0);
  }
  return 0;
}

/**
 * Calculate Greatest Common Divisor
 */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Extract comprehensive metadata from a user-selected video file
 */
export function loadVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Video metadata loading timed out. Please check file format.'));
    }, 12000);

    function cleanup() {
      clearTimeout(timeout);
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('error', onError);
    }

    function onLoaded() {
      cleanup();
      const w = video.videoWidth || 1920;
      const h = video.videoHeight || 1080;
      const dur = video.duration || 0;

      const divisor = gcd(w, h);
      const simpW = w / divisor;
      const simpH = h / divisor;
      let ratioStr = `${simpW}:${simpH}`;

      // Simplify common standard proportions
      const dec = w / h;
      if (Math.abs(dec - 16 / 9) < 0.03) ratioStr = '16:9';
      else if (Math.abs(dec - 9 / 16) < 0.03) ratioStr = '9:16';
      else if (Math.abs(dec - 4 / 3) < 0.03) ratioStr = '4:3';
      else if (Math.abs(dec - 1 / 1) < 0.02) ratioStr = '1:1';
      else if (Math.abs(dec - 21 / 9) < 0.05) ratioStr = '21:9';

      resolve({
        file,
        name: file.name,
        size: file.size,
        sizeFormatted: formatBytes(file.size),
        type: file.type || 'video/mp4',
        duration: dur,
        durationFormatted: formatTimecode(dur, false),
        width: w,
        height: h,
        aspectRatio: ratioStr,
        aspectRatioDecimal: dec.toFixed(2),
        url,
      });
    }

    function onError() {
      cleanup();
      reject(new Error('Unable to read video file. Format may be corrupted or unsupported.'));
    }

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('error', onError);
  });
}

/**
 * Generate a filmstrip of thumbnail frames along the timeline
 */
export async function generateFilmstripThumbnails(
  videoUrl: string,
  duration: number,
  count = 8
): Promise<string[]> {
  if (duration <= 0) return [];
  const thumbnails: string[] = [];
  const video = document.createElement('video');
  video.src = videoUrl;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';

  await new Promise<void>((res) => {
    video.addEventListener('loadeddata', () => res(), { once: true });
    video.load();
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  // Thumbnail dimensions
  canvas.width = 120;
  canvas.height = 68;

  const interval = duration / count;

  for (let i = 0; i < count; i++) {
    const targetTime = Math.min(duration - 0.05, Math.max(0.05, i * interval + interval / 2));
    video.currentTime = targetTime;

    await new Promise<void>((res) => {
      video.addEventListener('seeked', () => res(), { once: true });
    });

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    thumbnails.push(canvas.toDataURL('image/jpeg', 0.6));
  }

  return thumbnails;
}

/**
 * Client-Side In-Browser Video Trimmer using HTML5 Video, AudioContext, Canvas, and MediaRecorder
 */
export async function trimVideo(
  sourceUrl: string,
  options: TrimOptions
): Promise<TrimResult> {
  const { startTime, endTime, keepAudio, outputFormat, onProgress } = options;
  const trimDuration = Math.max(0.1, endTime - startTime);

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = sourceUrl;
    video.preload = 'auto';
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    // Best supported mimeType
    let mimeType = 'video/webm;codecs=vp8,opus';
    if (outputFormat === 'mp4' && MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
      mimeType = 'video/webm;codecs=vp9,opus';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm';
    }

    video.addEventListener('loadedmetadata', async () => {
      try {
        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('Canvas 2D context unavailable');

        // Setup audio stream if requested
        let combinedStream: MediaStream;
        const canvasStream = canvas.captureStream(30);

        let audioCtx: AudioContext | null = null;
        let audioSource: MediaElementAudioSourceNode | null = null;
        let audioDest: MediaStreamAudioDestinationNode | null = null;

        if (keepAudio) {
          try {
            audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            audioSource = audioCtx.createMediaElementSource(video);
            audioDest = audioCtx.createMediaStreamDestination();
            audioSource.connect(audioDest);
            audioSource.connect(audioCtx.destination); // Keep local playback in sync

            combinedStream = new MediaStream([
              ...canvasStream.getVideoTracks(),
              ...audioDest.stream.getAudioTracks(),
            ]);
          } catch {
            combinedStream = canvasStream;
          }
        } else {
          video.muted = true;
          combinedStream = canvasStream;
        }

        const chunks: Blob[] = [];
        const recorder = new MediaRecorder(combinedStream, {
          mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
          videoBitsPerSecond: 4_000_000, // Crisp 4 Mbps
        });

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        let isCancelled = false;
        let animationFrameId: number;

        recorder.onstop = () => {
          cancelAnimationFrame(animationFrameId);
          if (audioCtx) audioCtx.close();

          if (isCancelled) {
            reject(new Error('Trimming operation was cancelled.'));
            return;
          }

          const outBlob = new Blob(chunks, { type: mimeType });
          const outUrl = URL.createObjectURL(outBlob);
          resolve({
            blob: outBlob,
            url: outUrl,
            size: outBlob.size,
            sizeFormatted: formatBytes(outBlob.size),
            duration: trimDuration,
            durationFormatted: formatTimecode(trimDuration, false),
            format: outputFormat.toUpperCase(),
          });
        };

        // Render loop
        function drawFrame() {
          if (video.currentTime >= endTime || video.ended || video.paused) {
            if (recorder.state === 'recording') {
              recorder.stop();
            }
            return;
          }

          ctx?.drawImage(video, 0, 0, width, height);

          const elapsed = Math.max(0, video.currentTime - startTime);
          const percent = Math.min(100, Math.round((elapsed / trimDuration) * 100));
          if (onProgress) onProgress(percent, video.currentTime);

          animationFrameId = requestAnimationFrame(drawFrame);
        }

        // Seek to start and begin recording
        video.currentTime = startTime;

        video.addEventListener('seeked', async () => {
          ctx.drawImage(video, 0, 0, width, height);
          recorder.start(100);

          try {
            await video.play();
            drawFrame();
          } catch (err) {
            recorder.stop();
            reject(err);
          }
        }, { once: true });

        // Safety timeout to prevent infinite loops
        const maxExpectedMs = (trimDuration + 5) * 1000;
        setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }, maxExpectedMs);

      } catch (err) {
        reject(err);
      }
    }, { once: true });

    video.addEventListener('error', () => {
      reject(new Error('Failed to load video for trimming processing.'));
    }, { once: true });
  });
}

/**
 * Generate an animated sample video in-browser for immediate 1-click testing
 */
export async function generateSampleVideo(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const stream = canvas.captureStream(30);
  const chunks: Blob[] = [];

  let mimeType = 'video/webm;codecs=vp8';
  if (MediaRecorder.isTypeSupported('video/mp4')) mimeType = 'video/mp4';
  else if (MediaRecorder.isTypeSupported('video/webm')) mimeType = 'video/webm';

  const recorder = new MediaRecorder(stream, { mimeType });
  recorder.ondataavailable = (e) => chunks.push(e.data);

  return new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([blob], `imgfeel-sample-video.${ext}`, { type: mimeType });
      resolve(file);
    };

    recorder.start();

    let frame = 0;
    const totalFrames = 300; // 10 seconds @ 30fps

    function renderSampleFrame() {
      const t = frame / 30; // seconds
      const w = canvas.width;
      const h = canvas.height;

      // Dynamic animated gradient background
      const grad = ctx!.createLinearGradient(0, 0, w, h);
      const hue1 = (frame * 1.5) % 360;
      const hue2 = (hue1 + 60) % 360;
      grad.addColorStop(0, `hsl(${hue1}, 70%, 20%)`);
      grad.addColorStop(1, `hsl(${hue2}, 80%, 10%)`);
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, w, h);

      // Grid overlay
      ctx!.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx!.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, h);
        ctx!.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(w, y);
        ctx!.stroke();
      }

      // Floating shape
      const orbX = w / 2 + Math.cos(t * 2) * 300;
      const orbY = h / 2 + Math.sin(t * 3) * 150;
      const orbGrad = ctx!.createRadialGradient(orbX, orbY, 10, orbX, orbY, 100);
      orbGrad.addColorStop(0, 'rgba(56, 189, 248, 0.9)');
      orbGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
      ctx!.fillStyle = orbGrad;
      ctx!.beginPath();
      ctx!.arc(orbX, orbY, 100, 0, Math.PI * 2);
      ctx!.fill();

      // Brand text
      ctx!.fillStyle = '#ffffff';
      ctx!.font = 'bold 36px system-ui, -apple-system, sans-serif';
      ctx!.textAlign = 'center';
      ctx!.fillText('ImgFeel Video Trimmer Sample', w / 2, h / 2 - 40);

      // Dynamic timer
      ctx!.fillStyle = '#38bdf8';
      ctx!.font = 'bold 54px monospace';
      const timeStr = `00:${String(Math.floor(t)).padStart(2, '0')}.${String(Math.floor((t % 1) * 10)).padStart(1, '0')}s / 10.0s`;
      ctx!.fillText(timeStr, w / 2, h / 2 + 30);

      // Instruction note
      ctx!.fillStyle = '#94a3b8';
      ctx!.font = '500 20px system-ui, -apple-system, sans-serif';
      ctx!.fillText('Adjust the dual-handle sliders below to trim this clip', w / 2, h / 2 + 90);

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(renderSampleFrame);
      } else {
        recorder.stop();
      }
    }

    renderSampleFrame();
  });
}
