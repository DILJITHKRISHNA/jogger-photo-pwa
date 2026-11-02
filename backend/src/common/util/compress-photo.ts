import sharp from 'sharp';

/** Longest edge kept for product photos — plenty for a phone screen and WhatsApp. */
export const PHOTO_MAX_EDGE_PX = 1600;
const WEBP_QUALITY = 80;

/**
 * Converts a product photo to a compressed WebP (max 1600 px, ~80% quality —
 * typically 150–350 KB, against 10–20 MB for a camera original). Every
 * stored photo is WebP so galleries load fast; Share, Download and the ZIP
 * still hand out JPEG copies, which every app accepts as a normal photo.
 * Returns null if the image can't be decoded, so the caller can keep the
 * file as uploaded.
 */
export async function photoToWebp(buffer: Buffer): Promise<Buffer | null> {
  try {
    return await sharp(buffer, { failOn: 'none' })
      .rotate() // bake in the camera's EXIF orientation before metadata is dropped
      .resize({
        width: PHOTO_MAX_EDGE_PX,
        height: PHOTO_MAX_EDGE_PX,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch {
    return null;
  }
}
