import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const SVG_PATH = path.join(PUBLIC_DIR, 'favicon.svg');

async function createDibIcon(rawBuf, w, h) {
  const rowSizeAnd = Math.ceil(w / 32) * 4;
  const andMaskSize = rowSizeAnd * h;
  const xorSize = w * h * 4;
  const dibHeader = Buffer.alloc(40);
  dibHeader.writeUInt32LE(40, 0); // biSize
  dibHeader.writeInt32LE(w, 4); // biWidth
  dibHeader.writeInt32LE(h * 2, 8); // biHeight (double for icon mask)
  dibHeader.writeUInt16LE(1, 12); // biPlanes
  dibHeader.writeUInt16LE(32, 14); // biBitCount (32 bpp)
  dibHeader.writeUInt32LE(0, 16); // biCompression (BI_RGB)
  dibHeader.writeUInt32LE(xorSize + andMaskSize, 20); // biSizeImage

  const xorData = Buffer.alloc(xorSize);
  const andData = Buffer.alloc(andMaskSize);

  for (let y = 0; y < h; y++) {
    const srcY = h - 1 - y; // bottom-up
    for (let x = 0; x < w; x++) {
      const srcIdx = (srcY * w + x) * 4;
      const dstIdx = (y * w + x) * 4;
      xorData[dstIdx] = rawBuf[srcIdx + 2];     // Blue
      xorData[dstIdx + 1] = rawBuf[srcIdx + 1]; // Green
      xorData[dstIdx + 2] = rawBuf[srcIdx];     // Red
      xorData[dstIdx + 3] = rawBuf[srcIdx + 3]; // Alpha

      // 1-bit fallback mask: 1 = transparent, 0 = opaque
      if (rawBuf[srcIdx + 3] < 128) {
        const byteOffset = y * rowSizeAnd + Math.floor(x / 8);
        const bitOffset = 7 - (x % 8);
        andData[byteOffset] |= (1 << bitOffset);
      }
    }
  }

  return Buffer.concat([dibHeader, xorData, andData]);
}

async function buildIco(svgBuffer, sizes = [16, 32, 48]) {
  const images = [];
  for (const s of sizes) {
    const raw = await sharp(svgBuffer).resize(s, s).raw().toBuffer();
    const dib = await createDibIcon(raw, s, s);
    images.push({ width: s, height: s, data: dib });
  }

  const count = images.length;
  const headerSize = 6 + count * 16;
  let currentOffset = headerSize;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(count, 4); // icon count

  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(img.data.length, 8); // size
    entry.writeUInt32LE(currentOffset, 12); // offset
    entries.push(entry);
    currentOffset += img.data.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((img) => img.data)]);
}

async function generateAll() {
  console.log('Generating production ImgFeel favicons from:', SVG_PATH);
  const svgBuffer = fs.readFileSync(SVG_PATH);

  // 1. Build multi-resolution favicon.ico (16x16, 32x32, 48x48)
  const icoBuffer = await buildIco(svgBuffer, [16, 32, 48]);
  const icoDest = path.join(PUBLIC_DIR, 'favicon.ico');
  fs.writeFileSync(icoDest, icoBuffer);
  console.log(`✅ favicon.ico written (${icoBuffer.length} bytes, 16+32+48px multi-size)`);

  // 2. Build 48x48 PNG for Google Search
  const png48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-48x48.png'), png48);
  console.log(`✅ favicon-48x48.png written (${png48.length} bytes)`);

  // 3. Build 180x180 Apple Touch Icon
  const appleTouch = await sharp(svgBuffer).resize(180, 180).png().toBuffer();
  fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), appleTouch);
  console.log(`✅ apple-touch-icon.png written (${appleTouch.length} bytes)`);

  // 4. Build PWA manifest icons (192x192 and 512x512)
  const pwa192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
  fs.writeFileSync(path.join(PUBLIC_DIR, 'icon-192.png'), pwa192);
  console.log(`✅ icon-192.png written (${pwa192.length} bytes)`);

  const pwa512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(PUBLIC_DIR, 'icon-512.png'), pwa512);
  console.log(`✅ icon-512.png written (${pwa512.length} bytes)`);

  console.log('🎉 All ImgFeel favicons successfully created in /public!');
}

generateAll().catch((err) => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
