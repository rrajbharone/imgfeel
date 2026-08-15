/**
 * Shared utility functions for ImgFeel converters (HEIC, WebP, etc.)
 * Robust download triggers, ZIP packaging with proper ESM/CJS interop, and formatting.
 */

/**
 * Download a Blob reliably across all desktop and mobile browsers.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    } catch {
      // Ignored
    }
  }, 3000);
}

/**
 * Generate and download a ZIP archive from a list of files.
 * Handles ESM/CJS hybrid imports of jszip gracefully.
 */
export async function createAndDownloadZip(
  files: { name: string; blob: Blob }[],
  zipFilename: string = 'imgfeel-converted-images.zip'
): Promise<void> {
  const validFiles = files.filter((f) => f.blob && f.blob.size > 0);
  if (validFiles.length === 0) {
    throw new Error('No valid converted files to archive.');
  }

  const jszipModule = await import('jszip');
  const JSZipConstructor =
    (jszipModule as any).default?.default || (jszipModule as any).default || (jszipModule as any);

  if (typeof JSZipConstructor !== 'function') {
    throw new Error('JSZip constructor could not be initialized.');
  }

  const zip = new JSZipConstructor();
  for (const file of validFiles) {
    zip.file(file.name, file.blob);
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  downloadBlob(zipBlob, zipFilename);
}

/**
 * Format bytes to readable string (B, KB, MB).
 */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}
