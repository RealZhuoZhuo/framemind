import { NoOutputGeneratedError } from "ai";
import { ok, badRequest, notFound, serverError } from "@/app/api/_helpers/api-response";
import { getProjectScript, getTextGenerationService } from "@/lib/ai/text";
import { assetRepo, projectRepo } from "@/lib/repositories";
import { normalizeMediaStorageValue, withSignedMediaUrls } from "@/lib/storage/media-url";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await projectRepo.findById(id);
    if (!project) return notFound("Project not found");

    const script = await getProjectScript(id);
    if (script === null) return notFound("Project not found");
    if (!script.trim()) return badRequest("Project script is empty");

    const generatedAssets = await getTextGenerationService().extractAssetsFromScript(script);
    if (generatedAssets.length === 0) {
      return badRequest("No reusable project assets could be extracted from the script");
    }

    await assetRepo.deleteByProject(id);

    const assets = [];
    for (const asset of generatedAssets) {
      assets.push(
        await assetRepo.create(id, {
          ...asset,
          mediaUrl: normalizeMediaStorageValue(asset.mediaUrl),
        })
      );
    }

    return ok(await withSignedMediaUrls(assets));
  } catch (e) {
    if (NoOutputGeneratedError.isInstance(e)) {
      return badRequest("AI did not return valid structured asset data. Retry or simplify the script content.");
    }
    return serverError(e);
  }
}
