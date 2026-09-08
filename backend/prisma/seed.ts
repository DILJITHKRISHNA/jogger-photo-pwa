/**
 * Seeds the database with:
 *  - one ADMIN login + a couple of EXECUTIVE logins
 *  - the 7 default categories
 *  - a small demo photo catalogue (with real placeholder PNGs written to
 *    uploads/products/, hand-encoded — no image library needed)
 *  - matching Stock / Scheme / New Model rows and an Import History entry
 *    for each, including one deliberately "missing photo" stock row so the
 *    admin dashboard's warning banner has something to show on first run.
 *
 * Safe to re-run — upserts by unique key. Override the admin/exec
 * credentials via SEED_ADMIN_PHONE / SEED_ADMIN_PASSWORD / SEED_EXEC_PHONE
 * / SEED_EXEC_PASSWORD env vars.
 *
 * Usage: npm run prisma:seed
 */
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient, Role } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

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
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function placeholderPhotoPng(hex: string): Buffer {
  const size = 480;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const data = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
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
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* -------------------------------- data ------------------------------------ */
function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const CATEGORY_NAMES = ['PU Gents', 'PU Ladies', 'EVA', 'Supersoft', 'Casual', 'Sports', 'Kids'];

const COLOUR_HEX: Record<string, string> = {
  BLACK: '1f1b18',
  BROWN: '6b4226',
  TAN: 'c9a86a',
  LGRY: '9a9490',
  DGRN: '3d4f3a',
  KAKI: '8a7c52',
  GREY: '77726c',
  NAVY: '1f2a44',
  RED: '8c2f2f',
  BLUE: '2f4a8c',
  PINK: 'c07a8f',
  YELLOW: 'c9a63d',
};

const DEMO_PRODUCTS: Array<[string, string, string]> = [
  ['1001', 'BLACK', 'PU Gents'],
  ['1001', 'BROWN', 'PU Gents'],
  ['1002', 'BLACK', 'PU Gents'],
  ['2001', 'BLACK', 'PU Ladies'],
  ['2001', 'TAN', 'PU Ladies'],
  ['111', 'LGRY', 'EVA'],
  ['222', 'DGRN', 'EVA'],
  ['222', 'KAKI', 'EVA'],
  ['3001', 'GREY', 'Supersoft'],
  ['3002', 'NAVY', 'Supersoft'],
  ['4001', 'BLACK', 'Casual'],
  ['4002', 'BROWN', 'Casual'],
  ['5001', 'RED', 'Sports'],
  ['5002', 'BLUE', 'Sports'],
  ['6001', 'PINK', 'Kids'],
  ['6002', 'YELLOW', 'Kids'],
];

const STOCK_ROWS: Array<[string, string, string]> = [
  ['1001', 'BLACK', 'PU Gents'],
  ['1001', 'BROWN', 'PU Gents'],
  ['111', 'LGRY', 'EVA'],
  ['222', 'DGRN', 'EVA'],
  ['222', 'KAKI', 'EVA'],
  ['3001', 'GREY', 'Supersoft'],
  ['4001', 'BLACK', 'Casual'],
  ['5001', 'RED', 'Sports'],
  ['6001', 'PINK', 'Kids'],
  ['9999', 'WHITE', 'EVA'], // deliberately has no photo — demonstrates the "missing photo" warning
];

const SCHEME_ROWS: Array<[string, string]> = [
  ['111', 'LGRY'],
  ['222', 'DGRN'],
  ['222', 'KAKI'],
  ['2001', 'BLACK'],
];

const NEW_MODEL_ROWS: Array<[string, string]> = [
  ['5001', 'RED'],
  ['5002', 'BLUE'],
  ['6002', 'YELLOW'],
];

async function main() {
  const uploadsDir = path.join(process.cwd(), 'uploads', 'products');
  mkdirSync(uploadsDir, { recursive: true });

  // --- categories ---
  const categoryIdByName = new Map<string, string>();
  for (let i = 0; i < CATEGORY_NAMES.length; i++) {
    const name = CATEGORY_NAMES[i];
    const slug = slugify(name);
    const category = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, sortOrder: i },
    });
    categoryIdByName.set(name, category.id);
  }
  console.log(`Seeded ${CATEGORY_NAMES.length} categories.`);

  // --- users ---
  const adminPhone = process.env.SEED_ADMIN_PHONE ?? '9999999999';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const admin = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {},
    create: {
      name: 'Admin',
      phone: adminPhone,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: Role.ADMIN,
    },
  });
  console.log('Seeded ADMIN user:', admin.phone, '(password from SEED_ADMIN_PASSWORD or default)');

  const execPhone = process.env.SEED_EXEC_PHONE ?? '9000000001';
  const execPassword = process.env.SEED_EXEC_PASSWORD ?? 'ChangeMe123!';
  const exec = await prisma.user.upsert({
    where: { phone: execPhone },
    update: {},
    create: {
      name: 'User',
      phone: execPhone,
      passwordHash: await bcrypt.hash(execPassword, 12),
      role: Role.EXECUTIVE,
    },
  });
  console.log('Seeded EXECUTIVE user:', exec.phone, '(password from SEED_EXEC_PASSWORD or default)');

  // --- demo products + placeholder photos ---
  for (const [article, colour, categoryName] of DEMO_PRODUCTS) {
    const key = `${article}_${colour}`;
    const filePath = path.join(uploadsDir, `${key}.png`);
    if (!existsSync(filePath)) {
      writeFileSync(filePath, placeholderPhotoPng(COLOUR_HEX[colour] ?? '9a9490'));
    }
    await prisma.product.upsert({
      where: { article_colour: { article, colour } },
      update: {},
      create: {
        article,
        colour,
        categoryId: categoryIdByName.get(categoryName) ?? null,
        photoUrl: `/uploads/products/${key}.png`,
        photoFilename: `${article} ${colour}.png`,
      },
    });
  }
  console.log(`Seeded ${DEMO_PRODUCTS.length} demo products with placeholder photos.`);

  // --- stock (replace) ---
  await prisma.stockEntry.deleteMany({});
  await prisma.stockEntry.createMany({
    data: STOCK_ROWS.map(([article, colour, category]) => ({ article, colour, category })),
  });

  // --- scheme / new model (upsert) ---
  for (const [article, colour] of SCHEME_ROWS) {
    await prisma.schemeEntry.upsert({
      where: { article_colour: { article, colour } },
      update: {},
      create: { article, colour },
    });
  }
  for (const [article, colour] of NEW_MODEL_ROWS) {
    await prisma.newModelEntry.upsert({
      where: { article_colour: { article, colour } },
      update: {},
      create: { article, colour },
    });
  }
  console.log(`Seeded ${STOCK_ROWS.length} stock rows, ${SCHEME_ROWS.length} scheme rows, ${NEW_MODEL_ROWS.length} new model rows.`);

  // --- import history entries so the admin panel isn't empty on first run ---
  const existingImports = await prisma.importRecord.count();
  if (existingImports === 0) {
    await prisma.importRecord.createMany({
      data: [
        {
          type: 'STOCK',
          filename: 'demo-stock-seed.xlsx',
          total: STOCK_ROWS.length,
          success: STOCK_ROWS.length,
          errorCount: 0,
          errors: [],
          missingPhotos: ['9999 WHITE'],
        },
        {
          type: 'SCHEME',
          filename: 'demo-scheme-seed.xlsx',
          total: SCHEME_ROWS.length,
          success: SCHEME_ROWS.length,
          errorCount: 0,
          errors: [],
          missingPhotos: [],
        },
        {
          type: 'NEW_MODEL',
          filename: 'demo-new-model-seed.xlsx',
          total: NEW_MODEL_ROWS.length,
          success: NEW_MODEL_ROWS.length,
          errorCount: 0,
          errors: [],
          missingPhotos: [],
        },
        {
          type: 'PHOTOS',
          filename: `${DEMO_PRODUCTS.length} demo photos`,
          total: DEMO_PRODUCTS.length,
          success: DEMO_PRODUCTS.length,
          errorCount: 0,
          errors: [],
          missingPhotos: [],
        },
      ],
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
