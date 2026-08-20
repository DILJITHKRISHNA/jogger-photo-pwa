// Seeds data/db.json with a small demo catalogue (and matching placeholder
// photos in public/uploads/products) so the app is fully browsable on first
// run, without needing real product photography or Excel files yet.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");
const uploadsDir = path.join(root, "public", "uploads", "products");
mkdirSync(dataDir, { recursive: true });
mkdirSync(uploadsDir, { recursive: true });

const dbPath = path.join(dataDir, "db.json");
if (existsSync(dbPath)) {
  console.log("data/db.json already exists — skipping seed (delete it first to reseed).");
  process.exit(0);
}

/* ---------------------------- tiny PNG encoder --------------------------- */
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
function placeholderPhotoPng(hex, label) {
  const size = 480;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const data = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  // simple centered darker card, purely decorative placeholder art
  const pad = Math.round(size * 0.12);
  const dark = [Math.max(0, r - 35), Math.max(0, g - 35), Math.max(0, b - 35)];
  for (let y = pad; y < size - pad; y++) {
    for (let x = pad; x < size - pad; x++) {
      const border = x < pad + 6 || x > size - pad - 6 || y < pad + 6 || y > size - pad - 6;
      if (border) {
        const i = (y * size + x) * 4;
        data[i] = dark[0];
        data[i + 1] = dark[1];
        data[i + 2] = dark[2];
      }
    }
  }
  void label; // label reserved for a future bitmap-text pass

  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size * 4; x++) raw[y * (size * 4 + 1) + 1 + x] = data[y * size * 4 + x];
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* -------------------------------- data ------------------------------------ */
function slugify(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const now = new Date().toISOString();
const CATEGORY_NAMES = ["PU Gents", "PU Ladies", "EVA", "Supersoft", "Casual", "Sports", "Kids"];
const categories = CATEGORY_NAMES.map((name, index) => ({
  id: `cat_${slugify(name)}`,
  name,
  slug: slugify(name),
  hidden: false,
  sortOrder: index,
  createdAt: now,
  updatedAt: now,
}));
const catId = (name) => `cat_${slugify(name)}`;

const COLOUR_HEX = {
  BLACK: "1f1b18",
  BROWN: "6b4226",
  TAN: "c9a86a",
  LGRY: "9a9490",
  DGRN: "3d4f3a",
  KAKI: "8a7c52",
  GREY: "77726c",
  NAVY: "1f2a44",
  RED: "8c2f2f",
  BLUE: "2f4a8c",
  PINK: "c07a8f",
  YELLOW: "c9a63d",
};

const DEMO_PRODUCTS = [
  ["1001", "BLACK", "PU Gents"],
  ["1001", "BROWN", "PU Gents"],
  ["1002", "BLACK", "PU Gents"],
  ["2001", "BLACK", "PU Ladies"],
  ["2001", "TAN", "PU Ladies"],
  ["111", "LGRY", "EVA"],
  ["222", "DGRN", "EVA"],
  ["222", "KAKI", "EVA"],
  ["3001", "GREY", "Supersoft"],
  ["3002", "NAVY", "Supersoft"],
  ["4001", "BLACK", "Casual"],
  ["4002", "BROWN", "Casual"],
  ["5001", "RED", "Sports"],
  ["5002", "BLUE", "Sports"],
  ["6001", "PINK", "Kids"],
  ["6002", "YELLOW", "Kids"],
];

const products = DEMO_PRODUCTS.map(([article, colour, categoryName]) => {
  const hex = COLOUR_HEX[colour] ?? "9a9490";
  const filename = `${article} ${colour}.png`;
  const key = `${article}_${colour}`;
  writeFileSync(path.join(uploadsDir, `${key}.png`), placeholderPhotoPng(hex, `${article} ${colour}`));
  return {
    id: `prod_${randomUUID()}`,
    article,
    colour,
    categoryId: catId(categoryName),
    photoUrl: `/uploads/products/${key}.png`,
    photoFilename: filename,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
});

const stockRows = [
  ["1001", "BLACK", "PU Gents"],
  ["1001", "BROWN", "PU Gents"],
  ["111", "LGRY", "EVA"],
  ["222", "DGRN", "EVA"],
  ["222", "KAKI", "EVA"],
  ["3001", "GREY", "Supersoft"],
  ["4001", "BLACK", "Casual"],
  ["5001", "RED", "Sports"],
  ["6001", "PINK", "Kids"],
  ["9999", "WHITE", "EVA"], // deliberately has no photo — demonstrates the "missing photo" warning
];
const stock = stockRows.map(([article, colour, category]) => ({
  article,
  colour,
  category,
  stockDate: now,
}));

const schemeRows = [
  ["111", "LGRY"],
  ["222", "DGRN"],
  ["222", "KAKI"],
  ["2001", "BLACK"],
];
const scheme = schemeRows.map(([article, colour]) => ({ article, colour, addedAt: now }));

const newModelRows = [
  ["5001", "RED"],
  ["5002", "BLUE"],
  ["6002", "YELLOW"],
];
const newModels = newModelRows.map(([article, colour]) => ({ article, colour, addedAt: now }));

const imports = [
  {
    id: `imp_${randomUUID()}`,
    type: "stock",
    filename: "demo-stock-seed.xlsx",
    uploadedAt: now,
    total: stockRows.length,
    success: stockRows.length,
    errorCount: 0,
    errors: [],
    missingPhotos: ["9999 WHITE"],
  },
  {
    id: `imp_${randomUUID()}`,
    type: "scheme",
    filename: "demo-scheme-seed.xlsx",
    uploadedAt: now,
    total: schemeRows.length,
    success: schemeRows.length,
    errorCount: 0,
    errors: [],
    missingPhotos: [],
  },
  {
    id: `imp_${randomUUID()}`,
    type: "new-model",
    filename: "demo-new-model-seed.xlsx",
    uploadedAt: now,
    total: newModelRows.length,
    success: newModelRows.length,
    errorCount: 0,
    errors: [],
    missingPhotos: [],
  },
  {
    id: `imp_${randomUUID()}`,
    type: "photos",
    filename: `${products.length} demo photos`,
    uploadedAt: now,
    total: products.length,
    success: products.length,
    errorCount: 0,
    errors: [],
    missingPhotos: [],
  },
];

const db = { categories, products, stock, scheme, newModels, imports };
writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");

console.log(`Seeded ${products.length} demo products across ${categories.length} categories.`);
console.log(`Wrote ${dbPath}`);
