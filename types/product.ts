export type ImportType = "stock" | "scheme" | "new-model" | "photos";

export interface Category {
  id: string;
  name: string;
  slug: string;
  hidden: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** A photographed product. Article + Colour is the unique product key. */
export interface Product {
  id: string;
  article: string;
  colour: string;
  categoryId: string | null;
  photoUrl: string;
  photoFilename: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** One row of the latest "Today's Stock" Excel upload. Fully replaced on each upload. */
export interface StockEntry {
  article: string;
  colour: string;
  category: string | null;
  stockDate: string;
}

export interface SchemeEntry {
  article: string;
  colour: string;
  addedAt: string;
}

export interface NewModelEntry {
  article: string;
  colour: string;
  addedAt: string;
}

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

export interface JoggerDatabase {
  categories: Category[];
  products: Product[];
  stock: StockEntry[];
  scheme: SchemeEntry[];
  newModels: NewModelEntry[];
  imports: ImportRecord[];
}

/** A product joined with its resolved category name, for read APIs. */
export interface ProductView {
  id: string;
  article: string;
  colour: string;
  category: string | null;
  categorySlug: string | null;
  photoUrl: string;
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
