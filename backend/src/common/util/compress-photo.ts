import sharp from 'sharp';

/** Longest edge kept for product photos — plenty for a phone screen and WhatsApp. */
export const PHOTO_MAX_EDGE_PX = 1600;
/** Photos at or under this size are stored as uploaded. */
const SKIP_BELOW_BYTES = 500 * 1024;

/**
 * Shrinks a product photo (max 1600 px, ~80% quality) in its own format, so
 * its filename and URL never change. Full-size camera photos (10–20 MB) make
 * bulk sharing fail — browsers cap a share at 50 MB and phones run out of
 * memory fetching hundreds of them. Returns the original if it's already
 * small, can't be decoded, or wouldn't get smaller.
 */
export async function compressPhoto(
  buffer: Buffer,
  ext: string,
): Promise<Buffer> {
  if (buffer.length <= SKIP_BELOW_BYTES) return buffer;

  try {
    const pipeline = sharp(buffer, { failOn: 'none' })
      .rotate() // bake in the camera's EXIF orientation before metadata is dropped
      .resize({
        width: PHOTO_MAX_EDGE_PX,
        height: PHOTO_MAX_EDGE_PX,
        fit: 'inside',
        withoutEnlargement: true,
      });

    const format = ext.toLowerCase();
    const output =
      format === 'png'
        ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
        : format === 'webp'
          ? await pipeline.webp({ quality: 80 }).toBuffer()
          : await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();

    return output.length < buffer.length ? output : buffer;
  } catch {
    return buffer;
  }
}
