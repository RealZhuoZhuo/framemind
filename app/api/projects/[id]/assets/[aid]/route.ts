import { assetRepo } from "@/lib/repositories";
import { ok, notFound, noContent, badRequest, serverError } from "@/app/api/_helpers/api-response";
import type { AssetType } from "@/lib/db/types";
import type { UpdateAssetInput } from "@/lib/repositories/interfaces/asset.repository";

const ASSET_TYPES: AssetType[] = ["character", "scene", "prop"];

function isAssetType(value: unknown): value is AssetType {
  return typeof value === "string" && ASSET_TYPES.includes(value as AssetType);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; aid: string }> }
) {
  try {
    const { id, aid } = await params;

    const existing = await assetRepo.findById(aid);
    if (!existing || existing.projectId !== id) return notFound("Asset not found");

    const body = await request.json();
    const patch: UpdateAssetInput = {};
    if (body.type !== undefined) {
      if (!isAssetType(body.type)) return badRequest("type must be character, scene, or prop");
      patch.type = body.type;
    }
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) return badRequest("name must be a non-empty string");
      patch.name = body.name;
    }
    if (body.appearance !== undefined) patch.appearance = String(body.appearance);
    if (body.description !== undefined) patch.description = String(body.description);
    if ("mediaUrl" in body) patch.mediaUrl = body.mediaUrl ?? null;

    const updated = await assetRepo.update(aid, patch);
    if (!updated) return notFound("Asset not found");
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; aid: string }> }
) {
  try {
    const { id, aid } = await params;
    const existing = await assetRepo.findById(aid);
    if (!existing || existing.projectId !== id) return notFound("Asset not found");
    await assetRepo.delete(aid);
    return noContent();
  } catch (e) {
    return serverError(e);
  }
}
