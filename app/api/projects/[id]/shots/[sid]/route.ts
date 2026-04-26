import { assetRepo, shotRepo } from "@/lib/repositories";
import { ok, notFound, noContent, badRequest, serverError } from "@/app/api/_helpers/api-response";
import type { UpdateShotInput } from "@/lib/repositories/interfaces/shot.repository";

async function normalizeProjectAssetIds(
  projectId: string,
  rawAssetIds: unknown,
  options: { fieldName?: string; characterOnly?: boolean } = {}
) {
  if (rawAssetIds === undefined) return undefined;
  const fieldName = options.fieldName ?? "assetIds";
  if (!Array.isArray(rawAssetIds)) throw new Error(`${fieldName} must be an array`);

  const requestedIds = [...new Set(rawAssetIds.map(String).filter(Boolean))];
  if (requestedIds.length === 0) return [];

  const assets = await assetRepo.findByProject(projectId);
  const allowedIds = new Set(
    assets
      .filter((asset) => !options.characterOnly || asset.type === "character")
      .map((asset) => asset.id)
  );
  return requestedIds.filter((assetId) => allowedIds.has(assetId));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  try {
    const { id, sid } = await params;

    const existing = await shotRepo.findById(sid);
    if (!existing) return notFound("Shot not found");
    if (existing.projectId !== id) return notFound("Shot not found");

    const body = await request.json();
    const patch: UpdateShotInput = {};
    if (body.shotNumber !== undefined) {
      if (typeof body.shotNumber !== "number") return badRequest("shotNumber must be a number");
      patch.shotNumber = body.shotNumber;
    }
    if (body.sceneType !== undefined) patch.sceneType = String(body.sceneType);
    if (body.shotDescription !== undefined) patch.shotDescription = String(body.shotDescription);
    if (body.dialogueSpeaker !== undefined) patch.dialogueSpeaker = String(body.dialogueSpeaker);
    if (body.dialogue !== undefined) patch.dialogue = String(body.dialogue);
    if (body.characterAction !== undefined) patch.characterAction = String(body.characterAction);
    if (body.lightingMood !== undefined) patch.lightingMood = String(body.lightingMood);
    if ("mediaUrl" in body) patch.mediaUrl = body.mediaUrl ?? null;
    let normalizedAssetIds: string[] | undefined;
    let normalizedDialogueSpeakerIds: string[] | undefined;
    try {
      normalizedAssetIds = await normalizeProjectAssetIds(id, body.assetIds);
      normalizedDialogueSpeakerIds = await normalizeProjectAssetIds(id, body.dialogueSpeakerIds, {
        fieldName: "dialogueSpeakerIds",
        characterOnly: true,
      });
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : "Invalid asset ids");
    }

    const updated = await shotRepo.update(sid, patch);
    if (!updated) return notFound("Shot not found");
    if (normalizedAssetIds !== undefined) {
      await shotRepo.setAssets(sid, normalizedAssetIds);
    }
    if (normalizedDialogueSpeakerIds !== undefined) {
      await shotRepo.setDialogueSpeakers(sid, normalizedDialogueSpeakerIds);
    }
    if (normalizedAssetIds !== undefined || normalizedDialogueSpeakerIds !== undefined) {
      const refreshed = await shotRepo.findById(sid);
      if (!refreshed) return notFound("Shot not found");
      return ok(refreshed);
    }
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  try {
    const { id, sid } = await params;
    const existing = await shotRepo.findById(sid);
    if (!existing) return notFound("Shot not found");
    if (existing.projectId !== id) return notFound("Shot not found");
    await shotRepo.delete(sid);
    return noContent();
  } catch (e) {
    return serverError(e);
  }
}
