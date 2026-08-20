export interface PhotoUploadInput {
  buffer: Buffer;
  key: string;
  ext: string;
  contentType: string;
}

export interface PhotoUploadResult {
  url: string;
}

export interface PhotoStorageProvider {
  readonly name: string;
  isConfigured(): boolean;
  upload(input: PhotoUploadInput): Promise<PhotoUploadResult>;
}
