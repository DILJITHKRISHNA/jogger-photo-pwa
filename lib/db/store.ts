import { promises as fs } from "node:fs";

import { getWritableDataFilePath } from "@/lib/server-data-path";
import { emptyDatabase } from "@/lib/db/seed";
import type { JoggerDatabase } from "@/types/product";

const DB_FILENAME = "db.json";

let memoryDatabase: JoggerDatabase | null = null;

/** Serializes reads/writes so concurrent admin requests never corrupt the JSON file. */
let writeQueue: Promise<unknown> = Promise.resolve();

function withLock<T>(task: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(task, task);
  writeQueue = next.catch(() => undefined);
  return next;
}

function parseDatabase(raw: string): JoggerDatabase {
  try {
    const parsed = JSON.parse(raw) as Partial<JoggerDatabase>;
    const fallback = emptyDatabase();
    return {
      categories: Array.isArray(parsed.categories)
        ? parsed.categories
        : fallback.categories,
      products: Array.isArray(parsed.products) ? parsed.products : [],
      stock: Array.isArray(parsed.stock) ? parsed.stock : [],
      scheme: Array.isArray(parsed.scheme) ? parsed.scheme : [],
      newModels: Array.isArray(parsed.newModels) ? parsed.newModels : [],
      imports: Array.isArray(parsed.imports) ? parsed.imports : [],
    };
  } catch {
    return emptyDatabase();
  }
}

async function loadFromDisk(): Promise<JoggerDatabase> {
  const filePath = await getWritableDataFilePath(DB_FILENAME);
  if (!filePath) {
    return memoryDatabase ?? emptyDatabase();
  }

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = parseDatabase(raw);
    memoryDatabase = parsed;
    return parsed;
  } catch {
    const seeded = emptyDatabase();
    memoryDatabase = seeded;
    return seeded;
  }
}

async function persistToDisk(db: JoggerDatabase): Promise<void> {
  memoryDatabase = db;
  const filePath = await getWritableDataFilePath(DB_FILENAME);
  if (!filePath) return;

  try {
    await fs.writeFile(filePath, JSON.stringify(db, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to persist database to disk:", error);
    throw error;
  }
}

/** Read the current database. Safe to call from Server Components (read-only). */
export async function readDb(): Promise<JoggerDatabase> {
  if (memoryDatabase) return memoryDatabase;
  return loadFromDisk();
}

/**
 * Read-modify-write the database under a lock. `mutator` receives a mutable
 * draft and may edit it in place or return a replacement object.
 */
export async function mutateDb<T>(
  mutator: (draft: JoggerDatabase) => T | Promise<T>
): Promise<T> {
  return withLock(async () => {
    const current = memoryDatabase ?? (await loadFromDisk());
    const draft: JoggerDatabase = structuredClone(current);
    const result = await mutator(draft);
    await persistToDisk(draft);
    return result;
  });
}
