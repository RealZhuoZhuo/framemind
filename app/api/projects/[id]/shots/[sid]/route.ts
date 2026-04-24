import { shotRepo } from "@/lib/repositories";
import { ok, notFound, noContent, badRequest, serverError } from "@/app/api/_helpers/api-response";
import type { UpdateShotInput } from "@/lib/repositories/interfaces/shot.repository";

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
    if (body.dialogue !== undefined) patch.dialogue = String(body.dialogue);
    if (body.characterAction !== undefined) patch.characterAction = String(body.characterAction);
    if (body.lightingMood !== undefined) patch.lightingMood = String(body.lightingMood);
    if ("characterId" in body) patch.characterId = body.characterId || null;
    if ("mediaUrl" in body) patch.mediaUrl = body.mediaUrl ?? null;

    const updated = await shotRepo.update(sid, patch);
    if (!updated) return notFound("Shot not found");
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
