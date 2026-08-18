/**
 * Video Rotator Engine for ImgFeel.com
 * 100% Client-Side In-Browser Video Rotation & Transformation
 */

export interface VideoMetadata {
  file: File;
  name: string;
  size: number;
  sizeFormatted: string;
  type: string;
  duration: number;
  durationFormatted: string;
  width: number;
  height: number;
  aspectRatio: string;
  aspectRatioDecimal: string;
  url: string;
}

export interface RotateOptions {
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  keepAudio: boolean;
  outputFormat: 'mp4' | 'webm';
  onProgress?: (percent: number, currentTime: number) => void;
}

export interface RotateResult {
  blob: Blob;
  url: string;
  size: number;
  sizeFormatted: string;
  duration: number;
  durationFormatted: string;
  width: number;
  height: number;
  aspectRatio: string;
  format: string;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const mStr = String(mins).padStart(2, '0');
  const sStr = String(secs).padStart(2, '0');

  if (hrs > 0) {
    const hStr = String(hrs).padStart(2, '0');
    return `${hStr}:${mStr}:${sStr}`;
  }
  return `${mStr}:${sStr}`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function calculateAspectRatio(w: number, h: number): { ratio: string; decimal: string } {
  if (!w || !h) return { ratio: '16:9', decimal: '1.78' };
  const divisor = gcd(w, h);
  let ratio = `${w / divisor}:${h / divisor}`;
  const dec = w / h;

  if (Math.abs(dec - 16 / 9) < 0.03) ratio = '16:9';
  else if (Math.abs(dec - 9 / 16) < 0.03) ratio = '9:16';
  else if (Math.abs(dec - 4 / 3) < 0.03) ratio = '4:3';
  else if (Math.abs(dec - 3 / 4) < 0.03) ratio = '3:4';
  else if (Math.abs(dec - 1 / 1) < 0.02) ratio = '1:1';
  else if (Math.abs(dec - 21 / 9) < 0.05) ratio = '21:9';

  return { ratio, decimal: dec.toFixed(2) };
}

/**
 * Load video metadata from a local File
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
      reject(new Error('Video loading timed out.'));
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
      const { ratio, decimal } = calculateAspectRatio(w, h);

      resolve({
        file,
        name: file.name,
        size: file.size,
        sizeFormatted: formatBytes(file.size),
        type: file.type || 'video/mp4',
        duration: dur,
        durationFormatted: formatTime(dur),
        width: w,
        height: h,
        aspectRatio: ratio,
        aspectRatioDecimal: decimal,
        url,
      });
    }

    function onError() {
      cleanup();
      reject(new Error('Unable to read video file. Unsupported or corrupted format.'));
    }

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('error', onError);
  });
}

/**
 * Client-side video rotation rendering using Canvas and MediaRecorder
 */
export async function rotateVideo(
  sourceUrl: string,
  options: RotateOptions
): Promise<RotateResult> {
  const { rotation, flipH, flipV, keepAudio, outputFormat, onProgress } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = sourceUrl;
    video.preload = 'auto';
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    // Best supported format
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
        const srcW = video.videoWidth || 1280;
        const srcH = video.videoHeight || 720;
        const dur = video.duration || 1;

        // Determine output dimensions (swap for 90deg / 270deg)
        const isSwapped = rotation === 90 || rotation === 270;
        const outW = isSwapped ? srcH : srcW;
        const outH = isSwapped ? srcW : srcH;

        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('Canvas 2D context unavailable');

        // Setup audio stream
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
            audioSource.connect(audioCtx.destination);

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
          videoBitsPerSecond: 4_000_000,
        });

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        let animationFrameId: number;

        recorder.onstop = () => {
          cancelAnimationFrame(animationFrameId);
          if (audioCtx) audioCtx.close();

          const outBlob = new Blob(chunks, { type: mimeType });
          const outUrl = URL.createObjectURL(outBlob);
          const { ratio } = calculateAspectRatio(outW, outH);

          resolve({
            blob: outBlob,
            url: outUrl,
            size: outBlob.size,
            sizeFormatted: formatBytes(outBlob.size),
            duration: dur,
            durationFormatted: formatTime(dur),
            width: outW,
            height: outH,
            aspectRatio: ratio,
            format: outputFormat.toUpperCase(),
          });
        };

        // Render frame with rotation & flip matrix
        function renderTransformedFrame() {
          if (!ctx) return;
          ctx.save();
          ctx.translate(outW / 2, outH / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
          ctx.drawImage(video, -srcW / 2, -srcH / 2, srcW, srcH);
          ctx.restore();
        }

        function drawLoop() {
          if (video.ended || video.paused) {
            if (recorder.state === 'recording') {
              recorder.stop();
            }
            return;
          }

          renderTransformedFrame();

          const percent = Math.min(100, Math.round((video.currentTime / dur) * 100));
          if (onProgress) onProgress(percent, video.currentTime);

          animationFrameId = requestAnimationFrame(drawLoop);
        }

        video.currentTime = 0;
        video.addEventListener('seeked', async () => {
          renderTransformedFrame();
          recorder.start(100);

          try {
            await video.play();
            drawLoop();
          } catch (err) {
            recorder.stop();
            reject(err);
          }
        }, { once: true });

        // Safety timeout
        setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }, (dur + 6) * 1000);

      } catch (err) {
        reject(err);
      }
    }, { once: true });

    video.addEventListener('error', () => {
      reject(new Error('Failed to load video for rotation.'));
    }, { once: true });
  });
}

/**
 * Generate an animated sample video with clear orientation markers for instant testing
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
      const file = new File([blob], `imgfeel-sample-orientation.${ext}`, { type: mimeType });
      resolve(file);
    };

    recorder.start();

    let frame = 0;
    const totalFrames = 180; // 6 seconds @ 30fps

    function renderSample() {
      const t = frame / 30;
      const w = canvas.width;
      const h = canvas.height;

      // Dark futuristic gradient
      const grad = ctx!.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, w, h);

      // Orientation Arrows & Labels on 4 Edges
      ctx!.fillStyle = '#38bdf8';
      ctx!.font = 'bold 24px system-ui, sans-serif';
      ctx!.textAlign = 'center';

      // TOP
      ctx!.fillText('⬆ TOP ORIENTATION ⬆', w / 2, 40);

      // BOTTOM
      ctx!.fillText('⬇ BOTTOM EDGE ⬇', w / 2, h - 25);

      // LEFT
      ctx!.save();
      ctx!.translate(30, h / 2);
      ctx!.rotate(-Math.PI / 2);
      ctx!.fillText('⬅ LEFT SIDE ⬅', 0, 0);
      ctx!.restore();

      // RIGHT
      ctx!.save();
      ctx!.translate(w - 30, h / 2);
      ctx!.rotate(Math.PI / 2);
      ctx!.fillText('➡ RIGHT SIDE ➡', 0, 0);
      ctx!.restore();

      // Animated Center Compass Box
      ctx!.save();
      ctx!.translate(w / 2, h / 2);
      ctx!.rotate(t * 0.5);

      ctx!.fillStyle = 'rgba(99, 102, 241, 0.2)';
      ctx!.strokeStyle = '#6366f1';
      ctx!.lineWidth = 3;
      ctx!.fillRect(-120, -120, 240, 240);
      ctx!.strokeRect(-120, -120, 240, 240);

      ctx!.fillStyle = '#ffffff';
      ctx!.font = 'bold 28px system-ui, sans-serif';
      ctx!.textAlign = 'center';
      ctx!.fillText('ImgFeel', 0, -15);
      ctx!.font = '16px monospace';
      ctx!.fillStyle = '#a5b4fc';
      ctx!.fillText('ROTATOR SAMPLE', 0, 20);

      ctx!.restore();

      // Dynamic Timer
      ctx!.fillStyle = '#f8fafc';
      ctx!.font = 'bold 36px monospace';
      ctx!.fillText(`00:0${Math.floor(t)}s / 00:06s`, w / 2, h / 2 + 190);

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(renderSample);
      } else {
        recorder.stop();
      }
    }

    renderSample();
  });
}
