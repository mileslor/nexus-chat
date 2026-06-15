/**
 * Generates NexusChat icon files (icon.png, icon.icns, icon.ico)
 * Pure Node.js — no external image processing dependencies beyond png2icons
 */
import zlib from 'zlib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const png2icons = require('png2icons');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, '..', 'assets');
fs.mkdirSync(ASSETS, { recursive: true });

// ── PNG encoder ────────────────────────────────────────────────────────────

function crc32(buf) {
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })());
  let crc = 0xFFFFFFFF;
  for (const b of buf) crc = table[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

function encodePNG(rgba, w, h) {
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0; // filter: None
    rgba.copy(raw, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Canvas ────────────────────────────────────────────────────────────────

const SIZE = 1024;
const buf = Buffer.alloc(SIZE * SIZE * 4, 0);

function blendPixel(x, y, r, g, b, a) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  const sa = a / 255, da = buf[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa < 0.001) return;
  buf[i]     = (r * sa + buf[i]     * da * (1 - sa)) / oa;
  buf[i + 1] = (g * sa + buf[i + 1] * da * (1 - sa)) / oa;
  buf[i + 2] = (b * sa + buf[i + 2] * da * (1 - sa)) / oa;
  buf[i + 3] = oa * 255;
}

function fillRect(lx, ly, lw, lh, r, g, b) {
  for (let y = Math.max(0, ly); y < Math.min(SIZE, ly + lh); y++)
    for (let x = Math.max(0, lx); x < Math.min(SIZE, lx + lw); x++)
      blendPixel(x, y, r, g, b, 255);
}

// Anti-aliased thick diagonal line
function drawLine(ax, ay, bx, by, thick, r, g, b) {
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len;
  const steps = Math.ceil(len * 2);
  const half = thick / 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = ax + dx * t, cy = ay + dy * t;
    for (let w = -Math.ceil(half + 1); w <= Math.ceil(half + 1); w++) {
      const px = Math.round(cx + nx * w);
      const py = Math.round(cy + ny * w);
      const coverage = Math.min(1, half - Math.abs(w) + 0.5);
      if (coverage > 0) blendPixel(px, py, r, g, b, coverage * 255);
    }
  }
}

// ── Draw icon ─────────────────────────────────────────────────────────────

const PAD = 20, R = 200; // padding, corner radius
const x0 = PAD, y0 = PAD, x1 = SIZE - PAD, y1 = SIZE - PAD;

// Rounded square background with diagonal gradient
for (let y = y0; y <= y1; y++) {
  for (let x = x0; x <= x1; x++) {
    // Corner check
    let inside = true;
    if      (x < x0 + R && y < y0 + R) inside = Math.hypot(x - (x0+R), y - (y0+R)) <= R;
    else if (x > x1 - R && y < y0 + R) inside = Math.hypot(x - (x1-R), y - (y0+R)) <= R;
    else if (x < x0 + R && y > y1 - R) inside = Math.hypot(x - (x0+R), y - (y1-R)) <= R;
    else if (x > x1 - R && y > y1 - R) inside = Math.hypot(x - (x1-R), y - (y1-R)) <= R;
    if (!inside) continue;

    // Gradient: #2d1b69 top-left → #7c3aed bottom-right
    const t = ((x - x0) + (y - y0)) / ((x1 - x0) + (y1 - y0));
    blendPixel(x, y,
      Math.round(0x2d + t * (0x7c - 0x2d)),
      Math.round(0x1b + t * (0x3a - 0x1b)),
      Math.round(0x69 + t * (0xed - 0x69)),
      255
    );
  }
}

// White "N" — centered, bold
const LX = 270, LY = 190, LW = 484, LH = 644, ST = 96;

fillRect(LX, LY, ST, LH, 255, 255, 255);           // left bar
fillRect(LX + LW - ST, LY, ST, LH, 255, 255, 255); // right bar
drawLine(LX + ST, LY, LX + LW - ST, LY + LH, ST, 255, 255, 255); // diagonal

// Subtle shadow / glow around the letter edges (inner drop shadow feel)
// Just a slight padding already gives it depth via the gradient bg

// ── Save files ────────────────────────────────────────────────────────────

const pngBuf = encodePNG(buf, SIZE, SIZE);
fs.writeFileSync(path.join(ASSETS, 'icon.png'), pngBuf);
console.log('✓ icon.png (1024×1024)');

const icns = png2icons.createICNS(pngBuf, png2icons.BILINEAR, 0);
if (icns) {
  fs.writeFileSync(path.join(ASSETS, 'icon.icns'), icns);
  console.log('✓ icon.icns');
} else {
  console.warn('⚠ icon.icns failed');
}

const ico = png2icons.createICO(pngBuf, png2icons.BILINEAR, 0, false);
if (ico) {
  fs.writeFileSync(path.join(ASSETS, 'icon.ico'), ico);
  console.log('✓ icon.ico');
} else {
  console.warn('⚠ icon.ico failed');
}
