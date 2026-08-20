export function extFromUrl(url: string): string {
  const clean = url.split("?")[0];
  const dot = clean.lastIndexOf(".");
  if (dot === -1) return "jpg";
  return clean.slice(dot + 1).toLowerCase();
}

export function filenameFor(item: { article: string; colour: string; photoUrl: string }): string {
  return `${item.article} ${item.colour}.${extFromUrl(item.photoUrl)}`;
}
