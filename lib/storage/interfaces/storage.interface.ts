export interface IStorageService {
  /**
   * Upload a file buffer and return its object key.
   * `key` is the full object path, e.g. "projects/{id}/scripts/draft.docx"
   */
  upload(key: string, buffer: Buffer, contentType: string): Promise<string>;

  /**
   * Generate a short-lived pre-signed URL for direct browser download.
   * Default TTL: 3600 seconds.
   */
  presign(key: string, ttlSeconds?: number): Promise<string>;

  /** Delete an object by key. */
  delete(key: string): Promise<void>;
}
