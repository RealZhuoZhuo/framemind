import OSS from "ali-oss";
import type { IStorageService } from "./interfaces/storage.interface";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string) {
  return process.env[name]?.trim() || undefined;
}

function normalizeEndpoint(endpoint: string) {
  return endpoint.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function encodeObjectKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

export class AliyunOssStorageService implements IStorageService {
  private client: OSS;
  private publicBaseUrl: string;

  constructor() {
    const endpoint = normalizeEndpoint(requiredEnv("ALIYUN_OSS_ENDPOINT"));
    const bucket = requiredEnv("ALIYUN_OSS_BUCKET");

    this.client = new OSS({
      accessKeyId: requiredEnv("ALIYUN_OSS_ACCESS_KEY_ID"),
      accessKeySecret: requiredEnv("ALIYUN_OSS_ACCESS_KEY_SECRET"),
      stsToken: optionalEnv("ALIYUN_OSS_STS_TOKEN"),
      bucket,
      endpoint,
      region: optionalEnv("ALIYUN_OSS_REGION"),
      secure: process.env.ALIYUN_OSS_USE_SSL !== "false",
      cname: process.env.ALIYUN_OSS_CNAME === "true",
      timeout: process.env.ALIYUN_OSS_TIMEOUT ?? "120s",
    });

    this.publicBaseUrl = normalizeBaseUrl(
      optionalEnv("ALIYUN_OSS_PUBLIC_BASE_URL") ?? `https://${bucket}.${endpoint}`
    );
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<string> {
    await this.client.put(key, buffer, {
      mime: contentType,
      headers: {
        "Content-Type": contentType,
      },
    });

    return `${this.publicBaseUrl}/${encodeObjectKey(key)}`;
  }

  async presign(key: string, ttlSeconds = 3600): Promise<string> {
    return this.client.signatureUrl(key, {
      expires: ttlSeconds,
      method: "GET",
    });
  }

  async delete(key: string): Promise<void> {
    await this.client.delete(key);
  }
}
