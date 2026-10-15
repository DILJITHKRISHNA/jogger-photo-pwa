import { NotFoundException } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

/** Longest edge of a shared photo — sharp on any phone, small enough to send hundreds. */
const SHARE_MAX_EDGE_PX = 1280;
const PRODUCTS_DIR = path.join(process.cwd(), 'uploads', 'products');
const CACHE_DIR = path.join(process.cwd(), 'uploads', 'share-cache');
/** Only plain stored-photo filenames — never a path that could leave the uploads folder. */
const SAFE_NAME = /^[A-Za-z0-9_-]+\.(jpe?g|png|webp)$/i;

// Resizing a full-size camera photo is CPU-heavy; a few at a time keeps the API responsive
// while a phone fetches a 100-photo batch.
const MAX_CONCURRENT = 4;
let running = 0;
const waiting: Array<() => void> = [];

async function withSlot<T>(work: () => Promise<T>): Promise<T> {
  if (running >= MAX_CONCURRENT)
    await new Promise<void>((resolve) => waiting.push(resolve));
  running += 1;
  try {
    return await work();
  } finally {
    running -= 1;
    waiting.shift()?.();
  }
}

/**
 * A share-sized JPEG copy of a stored product photo (max 1280 px, ~80%
 * quality — typically 150–300 KB). Generated on first request and cached
 * next to the photos; the original is never modified. The cache entry is
 * keyed by the original's modification time, so a re-uploaded photo gets a
 * fresh copy.
 */
export async function sharePhotoJpeg(name: string): Promise<Buffer> {
  if (!SAFE_NAME.test(name)) throw new NotFoundException('Photo not found');

  const source = path.join(PRODUCTS_DIR, name);
  const stat = await fs.stat(source).catch(() => null);
  if (!stat?.isFile()) throw new NotFoundException('Photo not found');

  const cached = path.join(
    CACHE_DIR,
    `${name.replace(/\.[^.]+$/, '')}.${Math.floor(stat.mtimeMs)}.jpg`,
  );
  const hit = await fs.readFile(cached).catch(() => null);
  if (hit) return hit;

  return withSlot(async () => {
    const jpeg = await sharp(source, { failOn: 'none' })
      .rotate() // apply the camera's EXIF orientation
      .resize({
        width: SHARE_MAX_EDGE_PX,
        height: SHARE_MAX_EDGE_PX,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .flatten({ background: '#ffffff' }) // transparent PNGs → white, not black
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();

    await fs.mkdir(CACHE_DIR, { recursive: true });
    // Write-then-rename so a half-written file is never served.
    const tmp = `${cached}.${process.pid}.tmp`;
    await fs.writeFile(tmp, jpeg);
    await fs.rename(tmp, cached);
    return jpeg;
  });
}
