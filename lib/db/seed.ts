import type { JoggerDatabase } from "@/types/product";

const DEFAULT_CATEGORY_NAMES = [
  "PU Gents",
  "PU Ladies",
  "EVA",
  "Supersoft",
  "Casual",
  "Sports",
  "Kids",
];

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function emptyDatabase(): JoggerDatabase {
  const now = new Date().toISOString();
  return {
    categories: DEFAULT_CATEGORY_NAMES.map((name, index) => ({
      id: `cat_${slugify(name)}`,
      name,
      slug: slugify(name),
      hidden: false,
      sortOrder: index,
      createdAt: now,
      updatedAt: now,
    })),
    products: [],
    stock: [],
    scheme: [],
    newModels: [],
    imports: [],
  };
}
