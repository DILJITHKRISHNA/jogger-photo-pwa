/** Article + Colour = the unique product key throughout the system. */

export function normalizeArticle(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, " ");
}

export function normalizeColour(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, " ");
}

export function productKey(article: string, colour: string): string {
  return `${normalizeArticle(article)}::${normalizeColour(colour)}`;
}

export function labelFor(article: string, colour: string): string {
  return `${article} ${colour}`;
}
