import { Client } from "minio";
import { Readable } from "stream";
import type { IStorageService } from "./interfaces/storage.interface";

export class MinioStorageService implements IStorageService {
  private client: Client;
  private bucket: string;
  private publicBaseUrl: string;

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT!;
    const port = parseInt(process.env.MINIO_PORT ?? "9000", 10);
    const useSSL = process.env.MINIO_USE_SSL === "true";

    this.client = new Client({
      endPoint: endpoint,
      port,
      useSSL,
      accessKey: process.env.MINIO_ACCESS_KEY!,
      secretKey: process.env.MINIO_SECRET_KEY!,
    });

    this.bucket = process.env.MINIO_BUCKET!;
    const protocol = useSSL ? "https" : "http";
    this.publicBaseUrl = `${protocol}://${endpoint}:${port}/${this.bucket}`;
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<string> {
    await this.client.putObject(
      this.bucket,
      key,
      Readable.from(buffer),
      buffer.length,
      { "Content-Type": contentType }
    );
    return `${this.publicBaseUrl}/${key}`;
  }

  async presign(key: string, ttlSeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, key, ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }
}
