import { constants as fsConstants, promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

let cachedDataDirectory: string | null = null;
let writableDirectoryChecked = false;

/** Resolves a writable directory for the JSON "database" file, falling back to the OS tmp dir on read-only hosts. */
export async function getWritableDataDirectory(): Promise<string | null> {
  if (writableDirectoryChecked) {
    return cachedDataDirectory;
  }

  writableDirectoryChecked = true;

  const candidates = [
    path.join(process.cwd(), "data"),
    path.join(os.tmpdir(), "jogger-photo-pwa-data"),
  ];

  for (const directory of candidates) {
    try {
      await fs.mkdir(directory, { recursive: true });
      await fs.access(directory, fsConstants.W_OK);

      const testFile = path.join(directory, ".write-test");
      await fs.writeFile(testFile, "ok", "utf8");
      await fs.unlink(testFile);

      cachedDataDirectory = directory;
      return directory;
    } catch {
      continue;
    }
  }

  cachedDataDirectory = null;
  return null;
}

export async function getWritableDataFilePath(
  filename: string
): Promise<string | null> {
  const directory = await getWritableDataDirectory();
  if (!directory) return null;
  // The directory is resolved at runtime (dev dir or OS tmp dir), so tell
  // Turbopack not to trace the whole project through this dynamic join.
  return path.join(/* turbopackIgnore: true */ directory, filename);
}

/** Resolves a writable directory under /public so uploaded photos are served as static files by Next.js. */
export async function getWritableUploadsDirectory(): Promise<string | null> {
  const directory = path.join(process.cwd(), "public", "uploads", "products");
  try {
    await fs.mkdir(directory, { recursive: true });
    await fs.access(directory, fsConstants.W_OK);
    return directory;
  } catch {
    return null;
  }
}
