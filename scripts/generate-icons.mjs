// Self-contained PWA icon generator — no image/canvas dependency.
// Draws a simple brand mark (amber square + white "photo frame" + lens dot)
// straight into a raw RGBA buffer and hand-encodes it as PNG.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const BG = [201, 121, 66, 255]; // brand amber, ~ oklch(0.62 0.16 43)
const FRAME = [253, 251, 247, 255]; // near-white
const LENS = [43, 32, 24, 255]; // charcoal

function createCanvas(size) {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = BG[0];
    data[i * 4 + 1] = BG[1];
    data[i * 4 + 2] = BG[2];
    data[i * 4 + 3] = BG[3];
  }
  return { size, data };
}

function setPixel(canvas, x, y, color) {
  if (x < 0 || y < 0 || x >= canvas.size || y >= canvas.size) return;
  const i = (y * canvas.size + x) * 4;
  canvas.data[i] = color[0];
  canvas.data[i + 1] = color[1];
  canvas.data[i + 2] = color[2];
  canvas.data[i + 3] = color[3];
}

function fillRoundedRect(canvas, x0, y0, w, h, radius, color) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const dx = x < x0 + radius ? x0 + radius - x : x > x0 + w - radius ? x - (x0 + w - radius) : 0;
      const dy = y < y0 + radius ? y0 + radius - y : y > y0 + h - radius ? y - (y0 + h - radius) : 0;
      if (dx > 0 && dy > 0 && Math.hypot(dx, dy) > radius) continue;
      setPixel(canvas, x, y, color);
    }
  }
}

function fillCircle(canvas, cx, cy, r, color) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if (Math.hypot(x - cx, y - cy) <= r) setPixel(canvas, x, y, color);
    }
  }
}

function drawIcon(size, { maskable = false } = {}) {
  // Typed-array writes silently no-op on non-integer indices, so every
  // coordinate fed into setPixel must be rounded to a whole pixel first.
  const r = Math.round;
  const canvas = createCanvas(size);
  const pad = r(maskable ? size * 0.24 : size * 0.14);
  const frameSize = size - pad * 2;
  const radius = r(frameSize * 0.22);

  fillRoundedRect(canvas, pad, pad, frameSize, frameSize, radius, FRAME);

  // camera "lens" motif
  const cx = r(size / 2);
  const cy = r(size / 2 + frameSize * 0.04);
  fillCircle(canvas, cx, cy, r(frameSize * 0.24), BG);
  fillCircle(canvas, cx, cy, r(frameSize * 0.13), LENS);
  fillCircle(canvas, cx - r(frameSize * 0.05), cy - r(frameSize * 0.05), r(frameSize * 0.04), FRAME);

  // small "viewfinder" notch top
  fillRoundedRect(
    canvas,
    cx - r(frameSize * 0.12),
    pad + r(frameSize * 0.08),
    r(frameSize * 0.24),
    r(frameSize * 0.08),
    r(frameSize * 0.03),
    BG
  );

  return canvas;
}

// ---- minimal PNG encoder (8-bit RGBA, no interlace, filter 0) ----
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(canvas) {
  const { size, data } = canvas;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter type: none
    for (let x = 0; x < size * 4; x++) {
      raw[y * (size * 4 + 1) + 1 + x] = data[y * size * 4 + x];
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = deflateSync(raw);

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [180, 192, 512]) {
  const png = encodePNG(drawIcon(size));
  writeFileSync(path.join(outDir, `icon-${size}.png`), png);
}
const maskable = encodePNG(drawIcon(512, { maskable: true }));
writeFileSync(path.join(outDir, "icon-512-maskable.png"), maskable);

console.log(`Icons written to ${outDir}`);
