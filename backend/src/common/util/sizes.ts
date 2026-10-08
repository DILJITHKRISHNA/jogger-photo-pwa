/** Size ranges from the Stock Excel "Size" column, e.g. "6x10" or "6x10, 7x10". */

/** "6 X 10" / "6×10" / "6*10" → "6x10"; other labels are upper-cased (e.g. "xl" → "XL"). */
export function normalizeSize(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/(\d)\s*[X×*]\s*(\d)/g, '$1x$2');
}

/** One cell can list several sizes separated by commas, semicolons or new lines. */
export function parseSizes(cell: string | null | undefined): string[] {
  if (!cell) return [];
  return uniqueSizes(cell.split(/[,;\n]+/).map(normalizeSize));
}

/** De-duplicated, blank-free, in natural order (5x9 before 6x10 before 10x13). */
export function uniqueSizes(sizes: string[]): string[] {
  return [...new Set(sizes.filter(Boolean))].sort(compareSizes);
}

export function compareSizes(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}
