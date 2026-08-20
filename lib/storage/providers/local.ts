import { promises as fs } from "node:fs";
import path from "node:path";

import { getWritableUploadsDirectory } from "@/lib/server-data-path";
import type { PhotoStorageProvider } from "@/lib/storage/providers/types";

/**
 * Default storage: writes into /public/uploads/products so photos are served
 * as static files with zero configuration. Swap in the Supabase provider for
 * production/cloud storage by setting the Supabase env vars.
 */
export const localPhotoStorageProvider: PhotoStorageProvider = {
  name: "local",

  isConfigured() {
    return true;
  },

  async upload({ buffer, key, ext }) {
    const directory = await getWritableUploadsDirectory();
    if (!directory) {
      throw new Error("Local uploads directory is not writable in this environment");
    }

    // Replace any existing photo for this Article + Colour so we never duplicate it.
    const existing = await fs.readdir(directory).catch(() => [] as string[]);
    await Promise.all(
      existing
        .filter((f) => f.startsWith(`${key}.`))
        .map((f) => fs.unlink(path.join(directory, f)).catch(() => undefined))
    );

    const filename = `${key}.${ext}`;
    await fs.writeFile(path.join(/* turbopackIgnore: true */ directory, filename), buffer);

    return { url: `/uploads/products/${filename}` };
  },
};
