import { getStorage } from "@/lib/storage";

const PROJECT_OBJECT_KEY_PREFIX = "projects/";
const DEFAULT_SIGNED_MEDIA_TTL_SECONDS = 24 * 60 * 60;

export function getMediaUrlTtlSeconds() {
  const raw = Number(process.env.MEDIA_URL_TTL_SECONDS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_SIGNED_MEDIA_TTL_SECONDS;
}

function decodeObjectKey(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getStorageKeyFromMediaUrl(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return null;

  const localPath = raw.replace(/^\/+/, "");
  if (localPath.startsWith(PROJECT_OBJECT_KEY_PREFIX)) {
    return decodeObjectKey(localPath);
  }

  try {
    const url = new URL(raw);
    const key = decodeObjectKey(url.pathname.replace(/^\/+/, ""));
    return key.startsWith(PROJECT_OBJECT_KEY_PREFIX) ? key : null;
  } catch {
    return null;
  }
}

export function normalizeMediaStorageValue(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return null;
  return getStorageKeyFromMediaUrl(raw) ?? raw;
}

export async function signMediaUrl(value: string | null | undefined, ttlSeconds = getMediaUrlTtlSeconds()) {
  const raw = value?.trim();
  if (!raw) return null;

  const key = getStorageKeyFromMediaUrl(raw);
  if (!key) return raw;

  return getStorage().presign(key, ttlSeconds);
}

export async function withSignedMediaUrl<T extends { mediaUrl: string | null }>(row: T): Promise<T> {
  return {
    ...row,
    mediaUrl: await signMediaUrl(row.mediaUrl),
  };
}

export async function withSignedMediaUrls<T extends { mediaUrl: string | null }>(rows: T[]): Promise<T[]> {
  return Promise.all(rows.map((row) => withSignedMediaUrl(row)));
}

export async function withSignedShotMedia<
  T extends {
    mediaUrl: string | null;
    assets?: Array<{ mediaUrl: string | null }>;
    dialogueSpeakers?: Array<{ mediaUrl: string | null }>;
  },
>(shot: T): Promise<T> {
  const [mediaUrl, assets, dialogueSpeakers] = await Promise.all([
    signMediaUrl(shot.mediaUrl),
    shot.assets ? withSignedMediaUrls(shot.assets) : undefined,
    shot.dialogueSpeakers ? withSignedMediaUrls(shot.dialogueSpeakers) : undefined,
  ]);

  return {
    ...shot,
    mediaUrl,
    ...(assets ? { assets } : {}),
    ...(dialogueSpeakers ? { dialogueSpeakers } : {}),
  };
}

export async function withSignedShotMediaList<
  T extends {
    mediaUrl: string | null;
    assets?: Array<{ mediaUrl: string | null }>;
    dialogueSpeakers?: Array<{ mediaUrl: string | null }>;
  },
>(shots: T[]): Promise<T[]> {
  return Promise.all(shots.map((shot) => withSignedShotMedia(shot)));
}
