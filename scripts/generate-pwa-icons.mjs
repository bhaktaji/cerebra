import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generateAndroidAppIconPng(size, isMaskable = false) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const cx = size / 2;
  const cy = size / 2;
  const safeRadius = size * (isMaskable ? 0.34 : 0.4);

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter type 0
    for (let x = 0; x < size; x++) {
      const idx = rowStart + 1 + x * 4;
      // Rich Indigo Material 3 background gradient
      let r = 49 + Math.round((x / size) * 20);
      let g = 46 + Math.round((y / size) * 18);
      let b = 129 + Math.round(((x + y) / (2 * size)) * 55);

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Draw a crisp geometric 2x2 puzzle matrix emblem inside safe zone
      const inBox = Math.abs(dx) < safeRadius && Math.abs(dy) < safeRadius;
      const gap = size * 0.035;
      const inQuadrant =
        inBox && Math.abs(dx) > gap && Math.abs(dy) > gap;

      if (inQuadrant) {
        if (dx > 0 && dy > 0) {
          // Bottom-right emerald accent node
          r = 16;
          g = 185;
          b = 129;
        } else if (dx < 0 && dy < 0) {
          // Top-left bright indigo card
          r = 129;
          g = 140;
          b = 248;
        } else {
          // Crisp white puzzle tiles
          r = 248;
          g = 250;
          b = 252;
        }
      } else if (dist < safeRadius * 1.15 && dist > safeRadius * 1.08) {
        r = 99;
        g = 102;
        b = 241;
      }

      raw[idx] = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
      raw[idx + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

const pubDir = path.resolve('public');
fs.mkdirSync(pubDir, { recursive: true });
fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), generateAndroidAppIconPng(192, false));
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), generateAndroidAppIconPng(512, false));
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), generateAndroidAppIconPng(512, true));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), generateAndroidAppIconPng(180, false));
console.log('Generated Android & PWA PNG icons in public/');
