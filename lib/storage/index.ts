import type { IStorageService } from "./interfaces/storage.interface";

let _storage: IStorageService | null = null;

export function getStorage(): IStorageService {
  if (_storage) return _storage;

  const provider = process.env.STORAGE_PROVIDER ?? "minio";

  if (provider === "minio") {
    // Lazy import to avoid loading MinIO in environments that don't need it
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MinioStorageService } = require("./minio.storage") as typeof import("./minio.storage");
    _storage = new MinioStorageService();
  } else {
    throw new Error(`Unknown STORAGE_PROVIDER: "${provider}". Supported: "minio"`);
  }

  return _storage;
}
