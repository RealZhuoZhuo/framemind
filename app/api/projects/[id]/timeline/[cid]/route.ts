import { videoClipRepo } from "@/lib/repositories";
import { ok, notFound, noContent, badRequest, serverError } from "@/app/api/_helpers/api-response";
import type { UpdateClipInput } from "@/lib/repositories/interfaces/video-clip.repository";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const { id, cid } = await params;

    const existing = await videoClipRepo.findById(cid);
    if (!existing) return notFound("Clip not found");
    if (existing.projectId !== id) return notFound("Clip not found");

    const body = await request.json();
    const patch: UpdateClipInput = {};
    if (body.startSec !== undefined) {
      if (typeof body.startSec !== "number") return badRequest("startSec must be a number");
      patch.startSec = body.startSec;
    }
    if (body.endSec !== undefined) {
      if (typeof body.endSec !== "number") return badRequest("endSec must be a number");
      patch.endSec = body.endSec;
    }
    if (body.label !== undefined) patch.label = String(body.label);
    if ("mediaUrl" in body) patch.mediaUrl = body.mediaUrl ?? null;
    if ("subtitleText" in body) patch.subtitleText = body.subtitleText ?? null;

    const updated = await videoClipRepo.update(cid, patch);
    if (!updated) return notFound("Clip not found");
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
    const existing = await videoClipRepo.findById(cid);
    if (!existing) return notFound("Clip not found");
    if (existing.projectId !== id) return notFound("Clip not found");
    await videoClipRepo.delete(cid);
    return noContent();
  } catch (e) {
    return serverError(e);
  }
}
