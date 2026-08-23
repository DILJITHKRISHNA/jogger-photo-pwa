import { randomUUID } from "node:crypto";

import { mutateDb, readDb } from "@/lib/db/store";
import { slugify } from "@/lib/db/seed";
import { normalizeArticle, normalizeColour, productKey } from "@/lib/product-key";
import type {
  Category,
  DashboardStats,
  ImportRecord,
  ImportType,
  NewModelEntry,
  Product,
  ProductView,
  SchemeEntry,
  StockEntry,
} from "@/types/product";

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export async function listCategories(
  opts: { includeHidden?: boolean } = {}
): Promise<Category[]> {
  const db = await readDb();
  const categories = [...db.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  return opts.includeHidden ? categories : categories.filter((c) => !c.hidden);
}

export async function createCategory(name: string): Promise<Category> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name is required");

  return mutateDb((db) => {
    const slug = slugify(trimmed);
    if (db.categories.some((c) => c.slug === slug)) {
      throw new Error(`Category "${trimmed}" already exists`);
    }
    const now = new Date().toISOString();
    const category: Category = {
      id: `cat_${randomUUID()}`,
      name: trimmed,
      slug,
      hidden: false,
      sortOrder: db.categories.length,
      createdAt: now,
      updatedAt: now,
    };
    db.categories.push(category);
    return category;
  });
}

export async function updateCategory(
  id: string,
  patch: { name?: string; hidden?: boolean }
): Promise<Category | null> {
  return mutateDb((db) => {
    const category = db.categories.find((c) => c.id === id);
    if (!category) return null;

    if (patch.name !== undefined) {
      const trimmed = patch.name.trim();
      if (trimmed) {
        category.name = trimmed;
        category.slug = slugify(trimmed);
      }
    }
    if (patch.hidden !== undefined) {
      category.hidden = patch.hidden;
    }
    category.updatedAt = new Date().toISOString();
    return category;
  });
}

export async function deleteCategory(id: string): Promise<boolean> {
  return mutateDb((db) => {
    const before = db.categories.length;
    db.categories = db.categories.filter((c) => c.id !== id);
    db.products.forEach((p) => {
      if (p.categoryId === id) p.categoryId = null;
    });
    return db.categories.length < before;
  });
}

/* ------------------------------------------------------------------ */
/* Products (photo catalogue)                                          */
/* ------------------------------------------------------------------ */

export async function listProducts(filter?: {
  categoryId?: string;
  activeOnly?: boolean;
}): Promise<Product[]> {
  const db = await readDb();
  let products = [...db.products];
  if (filter?.categoryId) {
    products = products.filter((p) => p.categoryId === filter.categoryId);
  }
  if (filter?.activeOnly) {
    products = products.filter((p) => p.active);
  }
  return products.sort((a, b) => a.article.localeCompare(b.article));
}

export async function getProductByKey(
  article: string,
  colour: string
): Promise<Product | null> {
  const db = await readDb();
  const key = productKey(article, colour);
  return (
    db.products.find((p) => productKey(p.article, p.colour) === key) ?? null
  );
}

export async function upsertProduct(input: {
  article: string;
  colour: string;
  categoryId: string | null;
  photoUrl: string;
  photoFilename: string;
}): Promise<Product> {
  return mutateDb((db) => {
    const article = normalizeArticle(input.article);
    const colour = normalizeColour(input.colour);
    const key = productKey(article, colour);
    const now = new Date().toISOString();

    const existing = db.products.find(
      (p) => productKey(p.article, p.colour) === key
    );
    if (existing) {
      existing.categoryId = input.categoryId ?? existing.categoryId;
      existing.photoUrl = input.photoUrl;
      existing.photoFilename = input.photoFilename;
      existing.active = true;
      existing.updatedAt = now;
      return existing;
    }

    const product: Product = {
      id: `prod_${randomUUID()}`,
      article,
      colour,
      categoryId: input.categoryId,
      photoUrl: input.photoUrl,
      photoFilename: input.photoFilename,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    db.products.push(product);
    return product;
  });
}

export async function deleteProduct(id: string): Promise<boolean> {
  return mutateDb((db) => {
    const before = db.products.length;
    db.products = db.products.filter((p) => p.id !== id);
    return db.products.length < before;
  });
}

/* ------------------------------------------------------------------ */
/* Stock (fully replaced on every "Today's Stock" upload)              */
/* ------------------------------------------------------------------ */

export async function replaceStock(
  entries: Array<{ article: string; colour: string; category: string | null }>
): Promise<{ stockDate: string; count: number }> {
  return mutateDb((db) => {
    const stockDate = new Date().toISOString();
    db.stock = entries.map((e) => ({
      article: normalizeArticle(e.article),
      colour: normalizeColour(e.colour),
      category: e.category,
      stockDate,
    }));
    return { stockDate, count: db.stock.length };
  });
}

export async function listStock(): Promise<StockEntry[]> {
  const db = await readDb();
  return db.stock;
}

/* ------------------------------------------------------------------ */
/* Scheme articles (incremental — merged on each upload)               */
/* ------------------------------------------------------------------ */

export async function upsertSchemeEntries(
  entries: Array<{ article: string; colour: string }>
): Promise<{ count: number }> {
  return mutateDb((db) => {
    const now = new Date().toISOString();
    const byKey = new Map(
      db.scheme.map((e) => [productKey(e.article, e.colour), e])
    );
    for (const e of entries) {
      const article = normalizeArticle(e.article);
      const colour = normalizeColour(e.colour);
      const key = productKey(article, colour);
      const existing = byKey.get(key);
      if (existing) {
        existing.article = article;
        existing.colour = colour;
      } else {
        const entry: SchemeEntry = { article, colour, addedAt: now };
        byKey.set(key, entry);
      }
    }
    db.scheme = Array.from(byKey.values());
    return { count: db.scheme.length };
  });
}

export async function listScheme(): Promise<SchemeEntry[]> {
  const db = await readDb();
  return db.scheme;
}

/* ------------------------------------------------------------------ */
/* New models (incremental — merged on each upload)                    */
/* ------------------------------------------------------------------ */

export async function upsertNewModelEntries(
  entries: Array<{ article: string; colour: string }>
): Promise<{ count: number }> {
  return mutateDb((db) => {
    const now = new Date().toISOString();
    const byKey = new Map(
      db.newModels.map((e) => [productKey(e.article, e.colour), e])
    );
    for (const e of entries) {
      const article = normalizeArticle(e.article);
      const colour = normalizeColour(e.colour);
      const key = productKey(article, colour);
      const existing = byKey.get(key);
      if (existing) {
        existing.article = article;
        existing.colour = colour;
      } else {
        const entry: NewModelEntry = { article, colour, addedAt: now };
        byKey.set(key, entry);
      }
    }
    db.newModels = Array.from(byKey.values());
    return { count: db.newModels.length };
  });
}

export async function listNewModel(): Promise<NewModelEntry[]> {
  const db = await readDb();
  return db.newModels;
}

/* ------------------------------------------------------------------ */
/* Import history                                                       */
/* ------------------------------------------------------------------ */

export async function addImportRecord(
  record: Omit<ImportRecord, "id" | "uploadedAt">
): Promise<ImportRecord> {
  return mutateDb((db) => {
    const full: ImportRecord = {
      ...record,
      id: `imp_${randomUUID()}`,
      uploadedAt: new Date().toISOString(),
    };
    db.imports.unshift(full);
    db.imports = db.imports.slice(0, 200);
    return full;
  });
}

export async function listImports(type?: ImportType): Promise<ImportRecord[]> {
  const db = await readDb();
  const all = [...db.imports].sort((a, b) =>
    b.uploadedAt.localeCompare(a.uploadedAt)
  );
  return type ? all.filter((i) => i.type === type) : all;
}

export async function getImportById(id: string): Promise<ImportRecord | null> {
  const db = await readDb();
  return db.imports.find((i) => i.id === id) ?? null;
}

/* ------------------------------------------------------------------ */
/* Read-side views for the executive frontend                          */
/* ------------------------------------------------------------------ */

function toView(product: Product, categories: Category[]): ProductView {
  const category = categories.find((c) => c.id === product.categoryId) ?? null;
  return {
    id: product.id,
    article: product.article,
    colour: product.colour,
    category: category?.name ?? null,
    categorySlug: category?.slug ?? null,
    photoUrl: product.photoUrl,
  };
}

export async function searchByArticle(article: string): Promise<ProductView[]> {
  const db = await readDb();
  const needle = normalizeArticle(article);
  if (!needle) return [];
  return db.products
    .filter((p) => p.active && p.article.includes(needle))
    .sort((a, b) => a.colour.localeCompare(b.colour))
    .map((p) => toView(p, db.categories));
}

export async function getCategoryGallery(
  categorySlug: string
): Promise<ProductView[]> {
  const db = await readDb();
  const category = db.categories.find((c) => c.slug === categorySlug);
  if (!category) return [];
  return db.products
    .filter((p) => p.active && p.categoryId === category.id)
    .sort((a, b) => a.article.localeCompare(b.article))
    .map((p) => toView(p, db.categories));
}

export async function getStockGallery(categorySlug?: string): Promise<{
  items: ProductView[];
  stockDate: string | null;
}> {
  const db = await readDb();
  if (db.stock.length === 0) return { items: [], stockDate: null };

  const category = categorySlug
    ? db.categories.find((c) => c.slug === categorySlug)
    : undefined;
  if (categorySlug && !category) return { items: [], stockDate: null };

  const byKey = new Map(
    db.products
      .filter((p) => p.active && (!category || p.categoryId === category.id))
      .map((p) => [productKey(p.article, p.colour), p] as const)
  );

  const items: ProductView[] = [];
  for (const entry of db.stock) {
    const product = byKey.get(productKey(entry.article, entry.colour));
    if (product) items.push(toView(product, db.categories));
  }

  return {
    items: items.sort((a, b) => a.article.localeCompare(b.article)),
    stockDate: db.stock[0]?.stockDate ?? null,
  };
}

/** Per-category article counts for today's stock, for the Today's Stock category picker. */
export async function getStockCategoryCounts(): Promise<Map<string, number>> {
  const { items } = await getStockGallery();
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item.categorySlug) continue;
    counts.set(item.categorySlug, (counts.get(item.categorySlug) ?? 0) + 1);
  }
  return counts;
}

export async function getSchemeGallery(): Promise<ProductView[]> {
  const db = await readDb();
  const byKey = new Map(
    db.products
      .filter((p) => p.active)
      .map((p) => [productKey(p.article, p.colour), p] as const)
  );
  const items: ProductView[] = [];
  for (const entry of db.scheme) {
    const product = byKey.get(productKey(entry.article, entry.colour));
    if (product) items.push(toView(product, db.categories));
  }
  return items.sort((a, b) => a.article.localeCompare(b.article));
}

export async function getNewModelGallery(): Promise<ProductView[]> {
  const db = await readDb();
  const byKey = new Map(
    db.products
      .filter((p) => p.active)
      .map((p) => [productKey(p.article, p.colour), p] as const)
  );
  const items: ProductView[] = [];
  for (const entry of db.newModels) {
    const product = byKey.get(productKey(entry.article, entry.colour));
    if (product) items.push(toView(product, db.categories));
  }
  return items.sort((a, b) => a.article.localeCompare(b.article));
}

/** Admin "Search / Check" — full status for one Article + Colour combo. */
export async function checkProductStatus(article: string, colour: string) {
  const db = await readDb();
  const key = productKey(article, colour);
  const product =
    db.products.find((p) => productKey(p.article, p.colour) === key) ?? null;
  const category = product
    ? db.categories.find((c) => c.id === product.categoryId) ?? null
    : null;

  return {
    article: normalizeArticle(article),
    colour: normalizeColour(colour),
    hasPhoto: Boolean(product),
    photoUrl: product?.photoUrl ?? null,
    category: category?.name ?? null,
    inStock: db.stock.some((e) => productKey(e.article, e.colour) === key),
    inScheme: db.scheme.some((e) => productKey(e.article, e.colour) === key),
    isNewModel: db.newModels.some(
      (e) => productKey(e.article, e.colour) === key
    ),
  };
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                            */
/* ------------------------------------------------------------------ */

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await readDb();

  const byKey = new Map(
    db.products
      .filter((p) => p.active)
      .map((p) => [productKey(p.article, p.colour), p] as const)
  );
  const missingStockPhotoCount = db.stock.filter(
    (e) => !byKey.has(productKey(e.article, e.colour))
  ).length;

  const lastOf = (type: ImportType) =>
    db.imports
      .filter((i) => i.type === type)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0]?.uploadedAt ??
    null;

  const lastPhotoUpdate =
    db.products.length > 0
      ? db.products
          .map((p) => p.updatedAt)
          .sort()
          .reverse()[0]
      : null;

  const recentImportErrorCount = db.imports
    .slice(0, 10)
    .reduce((sum, i) => sum + i.errorCount, 0);

  return {
    photosCount: db.products.filter((p) => p.active).length,
    activeArticleCount: new Set(
      db.products.filter((p) => p.active).map((p) => p.article)
    ).size,
    categoriesCount: db.categories.filter((c) => !c.hidden).length,
    stockArticleCount: db.stock.length,
    schemeCount: db.scheme.length,
    newModelCount: db.newModels.length,
    missingStockPhotoCount,
    lastPhotoUpdate,
    lastStockUpload: lastOf("stock"),
    lastSchemeUpload: lastOf("scheme"),
    lastNewModelUpload: lastOf("new-model"),
    recentImportErrorCount,
  };
}
