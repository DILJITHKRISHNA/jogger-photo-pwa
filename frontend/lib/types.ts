export type Role = "ADMIN" | "EXECUTIVE";

export interface AppUser {
  id: string;
  name: string;
  phone: string;
  role: Role;
  initials: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  hidden: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  article: string;
  colour: string;
  categoryId: string | null;
  category: Category | null;
  photoUrl: string;
  photoFilename: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A product joined with its resolved category — what the catalogue (read) API returns. */
export interface ProductView {
  id: string;
  article: string;
  colour: string;
  category: string | null;
  categorySlug: string | null;
  photoUrl: string;
}

export interface StockEntry {
  id: string;
  article: string;
  colour: string;
  category: string | null;
  stockDate: string;
}

export interface SchemeEntry {
  id: string;
  article: string;
  colour: string;
  addedAt: string;
}

export interface NewModelEntry {
  id: string;
  article: string;
  colour: string;
  addedAt: string;
}

export type ImportType = "STOCK" | "SCHEME" | "NEW_MODEL" | "PHOTOS";

export interface ImportErrorRow {
  row: number;
  message: string;
  article?: string;
  colour?: string;
}

export interface ImportRecord {
  id: string;
  type: ImportType;
  filename: string;
  uploadedAt: string;
  total: number;
  success: number;
  errorCount: number;
  errors: ImportErrorRow[];
  missingPhotos: string[];
}

export interface DashboardStats {
  photosCount: number;
  activeArticleCount: number;
  categoriesCount: number;
  stockArticleCount: number;
  schemeCount: number;
  newModelCount: number;
  missingStockPhotoCount: number;
  lastPhotoUpdate: string | null;
  lastStockUpload: string | null;
  lastSchemeUpload: string | null;
  lastNewModelUpload: string | null;
  recentImportErrorCount: number;
}

export interface CheckResult {
  article: string;
  colour: string;
  hasPhoto: boolean;
  photoUrl: string | null;
  category: string | null;
  inStock: boolean;
  inScheme: boolean;
  isNewModel: boolean;
}
