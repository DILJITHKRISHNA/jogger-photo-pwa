import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface PhotoUploadInput {
  buffer: Buffer;
  key: string; // deterministic Article_Colour key, no extension
  ext: string;
  contentType: string;
}

export interface PhotoUploadResult {
  url: string;
}

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'products');

/**
 * Photo storage — local disk (uploads/products/, served at
 * /uploads/products/* by ServeStaticModule). On a host with an ephemeral
 * filesystem (most PaaS free/starter tiers), attach a persistent disk
 * mounted at /app/uploads so photos survive redeploys.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor() {
    this.logger.log('Photo storage: local disk (uploads/products/)');
  }

  async uploadPhoto(input: PhotoUploadInput): Promise<PhotoUploadResult> {
    const filename = `${input.key}.${input.ext}`;

    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    // Replace any existing photo for this Article + Colour so we never
    // duplicate it under a different extension.
    const existing = await fs.readdir(UPLOADS_DIR).catch(() => [] as string[]);
    await Promise.all(
      existing
        .filter((f) => f.startsWith(`${input.key}.`))
        .map((f) => fs.unlink(path.join(UPLOADS_DIR, f)).catch(() => undefined)),
    );

    await fs.writeFile(path.join(UPLOADS_DIR, filename), input.buffer);
    return { url: `/uploads/products/${filename}` };
  }

  async deletePhoto(url: string): Promise<void> {
    if (!url.startsWith('/uploads/products/')) return;
    const filename = url.replace('/uploads/products/', '');
    await fs.unlink(path.join(UPLOADS_DIR, filename)).catch(() => undefined);
  }
}
