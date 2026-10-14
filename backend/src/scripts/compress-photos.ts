/**
 * One-off: shrink product photos already stored on local disk
 * (uploads/products) to the same size new uploads get. Files keep their
 * name and format, so photo URLs in the database stay valid.
 *
 *   node dist/scripts/compress-photos.js --dry-run   # report only
 *   node dist/scripts/compress-photos.js             # compress in place
 *
 * Photos stored in Supabase are not touched.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { compressPhoto } from '../common/util/compress-photo';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'products');
const dryRun = process.argv.includes('--dry-run');

function mb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function main() {
  const names = (await fs.readdir(UPLOADS_DIR)).filter((n) =>
    /\.(jpe?g|png|webp)$/i.test(n),
  );
  let before = 0;
  let after = 0;
  let changed = 0;

  for (const name of names) {
    const file = path.join(UPLOADS_DIR, name);
    const original = await fs.readFile(file);
    const compressed = await compressPhoto(
      original,
      path.extname(name).slice(1),
    );
    before += original.length;
    after += compressed.length;
    if (compressed === original) continue;

    changed += 1;
    console.log(`${name}: ${mb(original.length)} -> ${mb(compressed.length)}`);
    if (!dryRun) {
      // Write next to it, then rename — a photo is never left half-written.
      const tmp = `${file}.tmp`;
      await fs.writeFile(tmp, compressed);
      await fs.rename(tmp, file);
    }
  }

  console.log(
    `${dryRun ? '[dry run] would compress' : 'Compressed'} ${changed} of ${names.length} photos: ` +
      `${mb(before)} -> ${mb(after)}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
