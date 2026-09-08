import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
 * Photo storage — local disk by default (uploads/products/, served at
 * /uploads/products/* by ServeStaticModule), automatically switching to
 * S3-compatible object storage once its env vars are set. Callers never
 * touch either directly, only uploadPhoto()/deletePhoto() below.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client | null = null;
  private bucket = '';

  constructor(private readonly config: ConfigService) {
    const bucket = this.config.get<string>('S3_BUCKET');
    const accessKeyId = this.config.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('S3_SECRET_ACCESS_KEY');

    if (bucket && accessKeyId && secretAccessKey) {
      this.bucket = bucket;
      const endpoint = this.config.get<string>('S3_ENDPOINT');
      this.s3 = new S3Client({
        region: this.config.get<string>('S3_REGION'),
        endpoint: endpoint || undefined,
        forcePathStyle: this.config.get<boolean>('S3_FORCE_PATH_STYLE'),
        credentials: { accessKeyId, secretAccessKey },
      });
      this.logger.log(`Photo storage: S3 bucket "${bucket}"`);
    } else {
      this.logger.log('Photo storage: local disk (uploads/products/)');
    }
  }

  isCloudConfigured(): boolean {
    return this.s3 !== null;
  }

  async uploadPhoto(input: PhotoUploadInput): Promise<PhotoUploadResult> {
    const filename = `${input.key}.${input.ext}`;

    if (this.s3) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: `products/${filename}`,
          Body: input.buffer,
          ContentType: input.contentType,
        }),
      );
      const endpoint = this.config.get<string>('S3_ENDPOINT');
      const base = endpoint
        ? `${endpoint.replace(/\/$/, '')}/${this.bucket}`
        : `https://${this.bucket}.s3.amazonaws.com`;
      return { url: `${base}/products/${filename}` };
    }

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
    if (this.s3) {
      const key = url.split(`${this.bucket}/`).pop();
      if (!key) return;
      await this.s3
        .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
        .catch(() => undefined);
      return;
    }

    if (!url.startsWith('/uploads/products/')) return;
    const filename = url.replace('/uploads/products/', '');
    await fs.unlink(path.join(UPLOADS_DIR, filename)).catch(() => undefined);
  }
}
