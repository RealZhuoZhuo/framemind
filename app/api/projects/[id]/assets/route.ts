import { assetRepo, projectRepo } from "@/lib/repositories";
import { ok, created, badRequest, notFound, serverError } from "@/app/api/_helpers/api-response";
import { normalizeMediaStorageValue, withSignedMediaUrls, withSignedMediaUrl } from "@/lib/storage/media-url";
import type { AssetType } from "@/lib/db/types";

const ASSET_TYPES: AssetType[] = ["character", "scene", "prop"];

function isAssetType(value: unknown): value is AssetType {
  return typeof value === "string" && ASSET_TYPES.includes(value as AssetType);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await projectRepo.findById(id);
    if (!project) return notFound("Project not found");
    const assets = await assetRepo.findByProject(id);
    return ok(await withSignedMediaUrls(assets));
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await projectRepo.findById(id);
    if (!project) return notFound("Project not found");
    const body = await request.json();
    const { type, name, appearance, description, mediaUrl } = body;

    if (!isAssetType(type)) return badRequest("type must be character, scene, or prop");
    if (!name || typeof name !== "string") return badRequest("name is required");

    const asset = await assetRepo.create(id, {
      type,
      name,
      appearance,
      description,
      mediaUrl: normalizeMediaStorageValue(mediaUrl),
    });
    return created(await withSignedMediaUrl(asset));
  } catch (e) {
    return serverError(e);
  }
}
