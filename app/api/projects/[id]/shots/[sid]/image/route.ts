import { generateShotImageToStorage } from "@/lib/ai/shot-image-generation";
import { shotRepo } from "@/lib/repositories";
import { notFound, ok, serverError } from "@/app/api/_helpers/api-response";
import { withSignedShotMedia } from "@/lib/storage/media-url";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  try {
    const { id, sid } = await params;
    const shot = await shotRepo.findById(sid);
    if (!shot || shot.projectId !== id) {
      return notFound("Shot not found");
    }

    const assets = await shotRepo.findAssetsByShot(sid);
    const { mediaUrl } = await generateShotImageToStorage(shot, assets);
    const updated = await shotRepo.update(sid, { mediaUrl });
    if (!updated) return notFound("Shot not found");

    return ok(await withSignedShotMedia(updated));
  } catch (e) {
    return serverError(e);
  }
}
