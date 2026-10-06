import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
const PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

interface SupabaseConfig {
  url: string;
  key: string;
  bucket: string;
}

/**
 * Photo storage.
 *
 * - Supabase Storage (public bucket) when SUPABASE_URL +
 *   SUPABASE_SERVICE_ROLE_KEY are set — required in production, because
 *   PaaS containers (e.g. Render) have an ephemeral filesystem and
 *   locally-written photos vanish on every restart/spin-down.
 * - Local disk (uploads/products/, served at /uploads/products/* by
 *   ServeStaticModule) otherwise, for local development.
 *
 * Talks to Supabase's Storage REST API directly — no SDK needed for the
 * three calls used here.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabase: SupabaseConfig | null;

  constructor(config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL');
    const key = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.supabase =
      url && key
        ? {
            url: url.replace(/\/+$/, ''),
            key,
            bucket:
              config.get<string>('SUPABASE_STORAGE_BUCKET') ?? 'product-photos',
          }
        : null;
  }

  async onModuleInit(): Promise<void> {
    if (!this.supabase) {
      this.logger.log('Photo storage: local disk (uploads/products/)');
      return;
    }
    await this.ensureBucket();
    this.logger.log(`Photo storage: Supabase bucket "${this.supabase.bucket}"`);
  }

  async uploadPhoto(input: PhotoUploadInput): Promise<PhotoUploadResult> {
    return this.supabase
      ? this.uploadToSupabase(this.supabase, input)
      : this.uploadToDisk(input);
  }

  async deletePhoto(url: string): Promise<void> {
    if (url.startsWith('/uploads/products/')) {
      const filename = url.replace('/uploads/products/', '');
      await fs.unlink(path.join(UPLOADS_DIR, filename)).catch(() => undefined);
      return;
    }

    if (!this.supabase) return;
    const prefix = this.publicUrlPrefix(this.supabase);
    if (!url.startsWith(prefix)) return;
    const objectPath = decodeURIComponent(
      url.slice(prefix.length).split('?')[0],
    );
    await this.removeObjects(this.supabase, [objectPath]).catch((err: Error) =>
      this.logger.warn(
        `Failed to delete ${objectPath} from Supabase: ${err.message}`,
      ),
    );
  }

  // ---- local disk ----

  private async uploadToDisk(
    input: PhotoUploadInput,
  ): Promise<PhotoUploadResult> {
    const filename = `${input.key}.${input.ext}`;

    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    // Replace any existing photo for this Article + Colour so we never
    // duplicate it under a different extension.
    const existing = await fs.readdir(UPLOADS_DIR).catch(() => [] as string[]);
    await Promise.all(
      existing
        .filter((f) => f.startsWith(`${input.key}.`))
        .map((f) =>
          fs.unlink(path.join(UPLOADS_DIR, f)).catch(() => undefined),
        ),
    );

    await fs.writeFile(path.join(UPLOADS_DIR, filename), input.buffer);
    return { url: `/uploads/products/${filename}` };
  }

  // ---- Supabase Storage ----

  private async uploadToSupabase(
    sb: SupabaseConfig,
    input: PhotoUploadInput,
  ): Promise<PhotoUploadResult> {
    const objectPath = `${input.key}.${input.ext}`;

    // Replace any existing photo for this Article + Colour stored under a
    // different extension (missing objects are ignored by Supabase).
    const stale = PHOTO_EXTENSIONS.filter((ext) => ext !== input.ext).map(
      (ext) => `${input.key}.${ext}`,
    );
    await this.removeObjects(sb, stale).catch(() => undefined);

    const res = await fetch(
      `${sb.url}/storage/v1/object/${sb.bucket}/${encodeURIComponent(objectPath)}`,
      {
        method: 'POST',
        headers: {
          ...this.authHeaders(sb),
          'Content-Type': input.contentType,
          'x-upsert': 'true',
          // URLs are versioned below, so the CDN can cache each version forever.
          'cache-control': 'max-age=31536000',
        },
        body: new Uint8Array(input.buffer),
      },
    );
    if (!res.ok) {
      throw new Error(
        `Supabase upload failed (${res.status}): ${await res.text()}`,
      );
    }

    // Re-uploading the same Article + Colour keeps the same object path; the
    // version query makes browsers, the PWA cache and Supabase's CDN fetch
    // the new image instead of serving the old one.
    return {
      url: `${this.publicUrlPrefix(sb)}${encodeURIComponent(objectPath)}?v=${Date.now()}`,
    };
  }

  private async removeObjects(
    sb: SupabaseConfig,
    objectPaths: string[],
  ): Promise<void> {
    if (objectPaths.length === 0) return;
    const res = await fetch(`${sb.url}/storage/v1/object/${sb.bucket}`, {
      method: 'DELETE',
      headers: { ...this.authHeaders(sb), 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes: objectPaths }),
    });
    if (!res.ok) {
      throw new Error(
        `Supabase delete failed (${res.status}): ${await res.text()}`,
      );
    }
  }

  /** Creates the bucket as public on first boot; photos are served to plain <img> tags. */
  private async ensureBucket(): Promise<void> {
    const sb = this.supabase!;
    const existing = await fetch(`${sb.url}/storage/v1/bucket/${sb.bucket}`, {
      headers: this.authHeaders(sb),
    });
    if (existing.ok) {
      const bucket = (await existing.json()) as { public?: boolean };
      if (!bucket.public) {
        this.logger.warn(
          `Supabase bucket "${sb.bucket}" is private — photos won't load. Make it public in the Supabase dashboard.`,
        );
      }
      return;
    }

    const created = await fetch(`${sb.url}/storage/v1/bucket`, {
      method: 'POST',
      headers: { ...this.authHeaders(sb), 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sb.bucket, name: sb.bucket, public: true }),
    });
    if (!created.ok) {
      throw new Error(
        `Could not create Supabase bucket "${sb.bucket}" (${created.status}): ${await created.text()}`,
      );
    }
    this.logger.log(`Created public Supabase bucket "${sb.bucket}"`);
  }

  private publicUrlPrefix(sb: SupabaseConfig): string {
    return `${sb.url}/storage/v1/object/public/${sb.bucket}/`;
  }

  private authHeaders(sb: SupabaseConfig): Record<string, string> {
    return { apikey: sb.key, Authorization: `Bearer ${sb.key}` };
  }
}
