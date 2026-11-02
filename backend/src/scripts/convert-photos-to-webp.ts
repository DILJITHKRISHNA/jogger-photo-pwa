/**
 * One-off: convert every existing product photo to a compressed WebP
 * (max 1600 px) — the format new uploads are stored in — so galleries load
 * fast. Nothing is deleted: each original stays where it is as a backup,
 * and every change is logged so it can be undone.
 *
 *   node dist/scripts/convert-photos-to-webp.js --dry-run   # report only
 *   node dist/scripts/convert-photos-to-webp.js             # convert
 *   node dist/scripts/convert-photos-to-webp.js --undo      # point photos back at the originals
 *
 * Works for photos on local disk and in Supabase Storage. Safe to re-run:
 * photos that are already WebP are skipped.
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { envValidationSchema } from '../config/env.validation';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { StorageModule } from '../modules/storage/storage.module';
import { StorageService } from '../modules/storage/storage.service';
import { photoToWebp } from '../common/util/compress-photo';
import { fileSafeKey } from '../common/util/parse-photo-filename';

/** Every conversion, so --undo can restore it. Lives on the uploads volume. */
const LOG_FILE = path.join(
  process.cwd(),
  'uploads',
  'webp-conversion-log.json',
);
const CONCURRENCY = 3;

interface Conversion {
  productId: string;
  label: string;
  from: string;
  to: string;
  convertedAt: string;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    StorageModule,
  ],
})
class ConvertModule {}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const isWebp = (url: string) => /\.webp(\?|$)/i.test(url);

async function readLog(): Promise<Conversion[]> {
  const text = await fs.readFile(LOG_FILE, 'utf8').catch(() => null);
  return text ? (JSON.parse(text) as Conversion[]) : [];
}

async function writeLog(entries: Conversion[]): Promise<void> {
  await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
  await fs.writeFile(LOG_FILE, JSON.stringify(entries, null, 2));
}

async function loadPhoto(url: string): Promise<Buffer> {
  if (url.startsWith('/uploads/')) {
    return fs.readFile(
      path.join(process.cwd(), url.split('?')[0].replace(/^\//, '')),
    );
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function photoExists(url: string): Promise<boolean> {
  if (url.startsWith('/uploads/')) {
    return fs
      .access(path.join(process.cwd(), url.split('?')[0].replace(/^\//, '')))
      .then(() => true)
      .catch(() => false);
  }
  const response = await fetch(url, { method: 'HEAD' }).catch(() => null);
  return Boolean(response?.ok);
}

async function convert(
  prisma: PrismaService,
  storage: StorageService,
  dryRun: boolean,
) {
  const products = await prisma.product.findMany({
    orderBy: [{ article: 'asc' }, { colour: 'asc' }],
  });
  const todo = products.filter((p) => !isWebp(p.photoUrl));
  console.log(
    `${products.length} photos, ${products.length - todo.length} already WebP, ${todo.length} to convert.`,
  );

  const log = await readLog();
  let before = 0;
  let after = 0;
  let converted = 0;
  const failed: string[] = [];

  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const product = todo[next++];
      const label = `${product.article} ${product.colour}`;
      try {
        const original = await loadPhoto(product.photoUrl);
        const webp = await photoToWebp(original);
        if (!webp) throw new Error('could not read the image');

        before += original.length;
        after += webp.length;
        console.log(`${label}: ${mb(original.length)} -> ${mb(webp.length)}`);
        if (dryRun) continue;

        const { url } = await storage.uploadPhoto({
          key: fileSafeKey(product.article, product.colour),
          ext: 'webp',
          buffer: webp,
          contentType: 'image/webp',
          replaceOtherFormats: false, // the original stays as a backup
        });
        await prisma.product.update({
          where: { id: product.id },
          data: { photoUrl: url },
        });
        log.push({
          productId: product.id,
          label,
          from: product.photoUrl,
          to: url,
          convertedAt: new Date().toISOString(),
        });
        converted += 1;
        // Save as we go, so an interrupted run can still be undone.
        if (converted % 20 === 0) await writeLog(log);
      } catch (error) {
        failed.push(
          `${label}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  if (!dryRun) await writeLog(log);

  console.log(
    `\n${dryRun ? '[dry run] Would convert' : 'Converted'} ${dryRun ? todo.length - failed.length : converted} photos: ${mb(before)} -> ${mb(after)}`,
  );
  if (!dryRun && converted > 0) {
    console.log(`Originals kept in place. Undo log: ${LOG_FILE}`);
  }
  if (failed.length > 0) {
    console.log(`\n${failed.length} skipped (left unchanged):`);
    for (const line of failed) console.log(`  ${line}`);
  }
}

async function undo(prisma: PrismaService) {
  const log = await readLog();
  if (log.length === 0) {
    console.log('Nothing to undo — no conversion log found.');
    return;
  }

  const remaining: Conversion[] = [];
  let restored = 0;
  for (const entry of log) {
    const product = await prisma.product.findUnique({
      where: { id: entry.productId },
    });
    // Re-uploaded since the conversion — that newer photo wins; nothing to restore.
    if (!product || product.photoUrl !== entry.to) continue;
    if (!(await photoExists(entry.from))) {
      console.log(
        `${entry.label}: original is gone (photo re-uploaded since?) — left as it is`,
      );
      remaining.push(entry);
      continue;
    }
    await prisma.product.update({
      where: { id: product.id },
      data: { photoUrl: entry.from },
    });
    restored += 1;
  }
  await writeLog(remaining);
  console.log(`Restored ${restored} photos to their originals.`);
}

async function main() {
  const app = await NestFactory.createApplicationContext(ConvertModule, {
    logger: ['error', 'warn'],
  });
  try {
    const prisma = app.get(PrismaService);
    if (process.argv.includes('--undo')) await undo(prisma);
    else
      await convert(
        prisma,
        app.get(StorageService),
        process.argv.includes('--dry-run'),
      );
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
