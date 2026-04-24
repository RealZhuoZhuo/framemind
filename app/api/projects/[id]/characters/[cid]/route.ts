import { characterRepo } from "@/lib/repositories";
import { ok, notFound, noContent, badRequest, serverError } from "@/app/api/_helpers/api-response";
import type { UpdateCharacterInput } from "@/lib/repositories/interfaces/character.repository";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const { id, cid } = await params;

    const existing = await characterRepo.findById(cid);
    if (!existing) return notFound("Character not found");
    if (existing.projectId !== id) return notFound("Character not found");

    const body = await request.json();
    const patch: UpdateCharacterInput = {};
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) return badRequest("name must be a non-empty string");
      patch.name = body.name;
    }
    if (body.appearance !== undefined) patch.appearance = String(body.appearance);
    if (body.description !== undefined) patch.description = String(body.description);
    if ("mediaUrl" in body) patch.mediaUrl = body.mediaUrl ?? null;

    const updated = await characterRepo.update(cid, patch);
    if (!updated) return notFound("Character not found");
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const { id, cid } = await params;
    const existing = await characterRepo.findById(cid);
    if (!existing) return notFound("Character not found");
    if (existing.projectId !== id) return notFound("Character not found");
    await characterRepo.delete(cid);
    return noContent();
  } catch (e) {
    return serverError(e);
  }
}
