import { getStorage } from "@/lib/storage";
import { created, badRequest, serverError } from "@/app/api/_helpers/api-response";

const CONTENT_TYPE_MAP: Record<string, string> = {
  doc:  "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  png:  "image/png",
  webp: "image/webp",
  mp3:  "audio/mpeg",
  wav:  "audio/wav",
  mp4:  "video/mp4",
};

const ALLOWED_ASSET_TYPES = ["script", "image", "audio", "video"] as const;
type AssetType = (typeof ALLOWED_ASSET_TYPES)[number];

const ALLOWED_EXTS: Record<AssetType, string[]> = {
  script: ["doc", "docx"],
  image:  ["jpg", "jpeg", "png", "webp"],
  audio:  ["mp3", "wav"],
  video:  ["mp4"],
};

const MAX_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file");
    const rawAssetType = (formData.get("assetType") as string | null) ?? "script";

    if (!file || !(file instanceof File)) {
      return badRequest("file is required");
    }

    if (!(ALLOWED_ASSET_TYPES as readonly string[]).includes(rawAssetType)) {
      return badRequest(`assetType must be one of: ${ALLOWED_ASSET_TYPES.join(", ")}`);
    }
    const assetType = rawAssetType as AssetType;

    if (file.size > MAX_SIZE_BYTES) {
      return badRequest(`File exceeds maximum size of ${MAX_SIZE_BYTES / 1024 / 1024} MB`);
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTS[assetType].includes(ext)) {
      return badRequest(
        `${assetType} uploads must be one of: ${ALLOWED_EXTS[assetType].join(", ")}`
      );
    }

    const contentType = CONTENT_TYPE_MAP[ext] ?? "application/octet-stream";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `projects/${id}/${assetType}/${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const storage = getStorage();
    const url = await storage.upload(key, buffer, contentType);

    return created({ key, url, filename: file.name, size: file.size });
  } catch (e) {
    return serverError(e);
  }
}
