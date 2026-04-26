import type { IStorageService } from "./interfaces/storage.interface";
import { AliyunOssStorageService } from "./aliyun-oss.storage";

let _storage: IStorageService | null = null;

export function getStorage(): IStorageService {
  if (_storage) return _storage;

  _storage = new AliyunOssStorageService();
  return _storage;
}
