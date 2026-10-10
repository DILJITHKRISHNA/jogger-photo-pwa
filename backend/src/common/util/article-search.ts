/**
 * Article search matching. Articles mix letters and digits ("SS5205"), and
 * a plain substring match is too loose — "5205" would also hit "15205".
 * Instead an article is split into tokens at letter/digit boundaries and
 * separators ("SS5205" → "SS", "5205"), and a query only matches whole
 * tokens (search) or the start of the article / of a token (suggestions).
 */

/** Upper-cases and drops everything but letters and digits: "ss-5205" → "SS5205". */
export function compactArticle(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function articleTokens(value: string): string[] {
  return value.toUpperCase().match(/[A-Z]+|[0-9]+/g) ?? [];
}

/**
 * Does `article` answer a full search for `query`? True when it is the same
 * article (ignoring spaces/dashes/case) or when the query is one of its whole
 * parts — the number part ("5205") or the text part ("SS").
 */
export function matchesSearch(article: string, query: string): boolean {
  const q = compactArticle(query);
  if (!q) return false;
  return compactArticle(article) === q || articleTokens(article).includes(q);
}

export function isExactArticle(article: string, query: string): boolean {
  const q = compactArticle(query);
  return q !== '' && compactArticle(article) === q;
}

/** Typeahead: the article, or any one of its parts, starts with what was typed. */
export function matchesSuggestion(article: string, query: string): boolean {
  const q = compactArticle(query);
  if (!q) return false;
  return (
    compactArticle(article).startsWith(q) ||
    articleTokens(article).some((token) => token.startsWith(q))
  );
}

/** Lower is better: exact article, then whole-part, then article prefix, then part prefix. */
export function suggestionRank(article: string, query: string): number {
  const q = compactArticle(query);
  const compact = compactArticle(article);
  if (compact === q) return 0;
  if (articleTokens(article).includes(q)) return 1;
  if (compact.startsWith(q)) return 2;
  return 3;
}
