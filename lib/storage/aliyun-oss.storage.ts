import { createHmac } from "node:crypto";
import type { IStorageService } from "./interfaces/storage.interface";

type OssMethod = "GET" | "PUT" | "DELETE";

const SIGNED_SUBRESOURCES = new Set([
  "acl",
  "partNumber",
  "security-token",
  "uploadId",
  "uploads",
  "response-cache-control",
  "response-content-disposition",
  "response-content-encoding",
  "response-content-language",
  "response-content-type",
  "response-expires",
]);

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

function encodeObjectKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

function hmacSha1Base64(secret: string, value: string) {
  return createHmac("sha1", secret).update(value, "utf8").digest("base64");
}

export class AliyunOssStorageService implements IStorageService {
  private accessKeyId: string;
  private accessKeySecret: string;
  private bucket: string;
  private endpoint: string;
  private host: string;
  private protocol: "http" | "https";
  private stsToken?: string;

  constructor() {
    this.accessKeyId = requiredEnv("ALIYUN_OSS_ACCESS_KEY_ID");
    this.accessKeySecret = requiredEnv("ALIYUN_OSS_ACCESS_KEY_SECRET");
    this.bucket = requiredEnv("ALIYUN_OSS_BUCKET");
    this.endpoint = normalizeEndpoint(requiredEnv("ALIYUN_OSS_ENDPOINT"));
    this.protocol = process.env.ALIYUN_OSS_USE_SSL === "false" ? "http" : "https";
    this.host = process.env.ALIYUN_OSS_CNAME === "true" ? this.endpoint : `${this.bucket}.${this.endpoint}`;
    this.stsToken = optionalEnv("ALIYUN_OSS_STS_TOKEN");
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<string> {
    await this.request("PUT", key, {
      contentType,
      body: new Uint8Array(buffer),
    });

    return key;
  }

  async presign(key: string, ttlSeconds = 3600): Promise<string> {
    const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
    const url = this.objectUrl(key);
    url.searchParams.set("OSSAccessKeyId", this.accessKeyId);
    url.searchParams.set("Expires", String(expires));
    if (this.stsToken) {
      url.searchParams.set("security-token", this.stsToken);
    }

    const signature = this.sign({
      method: "GET",
      key,
      contentType: "",
      dateOrExpires: String(expires),
      query: url.searchParams,
    });
    url.searchParams.set("Signature", signature);
    return url.toString();
  }

  async delete(key: string): Promise<void> {
    await this.request("DELETE", key, {
      contentType: "",
    });
  }

  private objectUrl(key: string) {
    return new URL(`/${encodeObjectKey(key)}`, `${this.protocol}://${this.host}`);
  }

  private async request(
    method: OssMethod,
    key: string,
    options: { contentType: string; body?: BodyInit }
  ) {
    const date = new Date().toUTCString();
    const headers = new Headers({
      Date: date,
    });
    const signature = this.sign({
      method,
      key,
      contentType: options.contentType,
      dateOrExpires: date,
    });
    headers.set("Authorization", `OSS ${this.accessKeyId}:${signature}`);

    if (options.contentType) {
      headers.set("Content-Type", options.contentType);
    }
    if (this.stsToken) {
      headers.set("x-oss-security-token", this.stsToken);
    }

    const response = await fetch(this.objectUrl(key), {
      method,
      headers,
      body: options.body,
    });

    if (!response.ok) {
      throw new Error(`Aliyun OSS ${method} failed: ${response.status} ${await response.text()}`);
    }
  }

  private sign(params: {
    method: OssMethod;
    key: string;
    contentType: string;
    dateOrExpires: string;
    query?: URLSearchParams;
  }) {
    const canonicalizedResource = this.canonicalizedResource(params.key, params.query);
    const canonicalizedOssHeaders = this.stsToken && !params.query
      ? `x-oss-security-token:${this.stsToken}\n`
      : "";
    const stringToSign = [
      params.method,
      "",
      params.contentType,
      params.dateOrExpires,
      `${canonicalizedOssHeaders}${canonicalizedResource}`,
    ].join("\n");
    const signature = hmacSha1Base64(this.accessKeySecret, stringToSign);
    return signature;
  }

  private canonicalizedResource(key: string, query?: URLSearchParams) {
    const resource = `/${this.bucket}/${key}`;
    if (!query) return resource;

    const subresources = [...query.entries()]
      .filter(([name]) => SIGNED_SUBRESOURCES.has(name))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, value]) => (value ? `${name}=${value}` : name));

    return subresources.length > 0 ? `${resource}?${subresources.join("&")}` : resource;
  }
}
