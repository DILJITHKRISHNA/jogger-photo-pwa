import { normalizeArticle, normalizeColour } from './product-key';

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

export type ParsedPhotoFilename =
  | { ok: true; article: string; colour: string; ext: string; original: string }
  | { ok: false; reason: string; original: string };

/**
 * Filename convention: "ARTICLE COLOUR.jpg" (e.g. "1001 BRWN.jpg", "222 DGRN.jpg").
 * Article + Colour is read straight from the filename so admins never type it by hand.
 */
export function parsePhotoFilename(filename: string): ParsedPhotoFilename {
  const original = filename;
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex <= 0) {
    return { ok: false, reason: 'Missing file extension', original };
  }

  const namePart = filename.slice(0, dotIndex).trim();
  const ext = filename.slice(dotIndex + 1).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      reason: `Unsupported file type ".${ext}" (use .jpg, .jpeg, .png or .webp)`,
      original,
    };
  }

  let separatorIndex = namePart.lastIndexOf(' ');
  if (separatorIndex <= 0) separatorIndex = namePart.lastIndexOf('_');
  if (separatorIndex <= 0) separatorIndex = namePart.lastIndexOf('-');

  if (separatorIndex <= 0) {
    return {
      ok: false,
      reason: 'Filename must be "ARTICLE COLOUR.jpg" (e.g. "1001 BRWN.jpg")',
      original,
    };
  }

  const article = namePart.slice(0, separatorIndex).trim();
  const colour = namePart.slice(separatorIndex + 1).trim();

  if (!article || !colour) {
    return {
      ok: false,
      reason: 'Filename must be "ARTICLE COLOUR.jpg" (e.g. "1001 BRWN.jpg")',
      original,
    };
  }

  return {
    ok: true,
    article: normalizeArticle(article),
    colour: normalizeColour(colour),
    ext,
    original,
  };
}

/** Deterministic, filesystem/URL-safe key used to store one photo per Article + Colour. */
export function fileSafeKey(article: string, colour: string): string {
  return `${normalizeArticle(article)}_${normalizeColour(colour)}`.replace(/[^A-Z0-9_]+/gi, '-');
}
