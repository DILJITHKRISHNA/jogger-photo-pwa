import { createClient } from "@supabase/supabase-js";

import type { PhotoStorageProvider } from "@/lib/storage/providers/types";

const BUCKET = process.env.SUPABASE_PHOTOS_BUCKET || "product-photos";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, serviceKey };
}

let cachedClient: ReturnType<typeof createClient> | null = null;

function getClient() {
  const { url, serviceKey } = getEnv();
  if (!url || !serviceKey) return null;
  if (!cachedClient) {
    cachedClient = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }
  return cachedClient;
}

/** Cloud storage provider — activates automatically once Supabase env vars are set. */
export const supabasePhotoStorageProvider: PhotoStorageProvider = {
  name: "supabase",

  isConfigured() {
    const { url, serviceKey } = getEnv();
    return Boolean(url && serviceKey);
  },

  async upload({ buffer, key, ext, contentType }) {
    const client = getClient();
    if (!client) throw new Error("Supabase storage is not configured");

    const path = `${key}.${ext}`;
    const { error } = await client.storage.from(BUCKET).upload(path, buffer, {
      contentType,
      upsert: true,
    });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    const { data } = client.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  },
};
