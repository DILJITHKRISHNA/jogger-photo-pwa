import { fileSafeKey } from "@/lib/parse-photo-filename";
import { localPhotoStorageProvider } from "@/lib/storage/providers/local";
import { supabasePhotoStorageProvider } from "@/lib/storage/providers/supabase";
import type { PhotoStorageProvider } from "@/lib/storage/providers/types";

const providers: PhotoStorageProvider[] = [
  supabasePhotoStorageProvider,
  localPhotoStorageProvider,
];

export function getActiveStorageProvider(): PhotoStorageProvider {
  return providers.find((p) => p.isConfigured()) ?? localPhotoStorageProvider;
}

export async function uploadProductPhoto(input: {
  article: string;
  colour: string;
  ext: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ url: string; provider: string }> {
  const provider = getActiveStorageProvider();
  const key = fileSafeKey(input.article, input.colour);
  const result = await provider.upload({
    key,
    ext: input.ext,
    buffer: input.buffer,
    contentType: input.contentType,
  });
  return { url: result.url, provider: provider.name };
}
