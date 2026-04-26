import { assetRepo } from "@/lib/repositories";
import { generateAssetImageToStorage } from "@/lib/ai/image";
import { notFound, ok, serverError } from "@/app/api/_helpers/api-response";
import { withSignedMediaUrl } from "@/lib/storage/media-url";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; aid: string }> }
) {
  try {
    const { id, aid } = await params;
    const asset = await assetRepo.findById(aid);
    if (!asset || asset.projectId !== id) {
      return notFound("Asset not found");
    }

    const { mediaUrl } = await generateAssetImageToStorage(asset);
    const updated = await assetRepo.update(aid, { mediaUrl });
    if (!updated) return notFound("Asset not found");

    return ok(await withSignedMediaUrl(updated));
  } catch (e) {
    return serverError(e);
  }
}
