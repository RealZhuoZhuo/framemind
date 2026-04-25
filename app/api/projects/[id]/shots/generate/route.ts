import { NoOutputGeneratedError } from "ai";
import { ok, badRequest, notFound, serverError } from "@/app/api/_helpers/api-response";
import { getProjectScript } from "@/lib/ai/project-script";
import { generateShotsFromScript } from "@/lib/ai/story-pipeline";
import { assetRepo, projectRepo, shotRepo } from "@/lib/repositories";

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

    const assets = await assetRepo.findByProject(id);
    if (assets.length === 0) {
      return badRequest("Generate assets before generating storyboard shots");
    }

    const generatedShots = await generateShotsFromScript(script, assets);
    if (generatedShots.length === 0) {
      return badRequest("No storyboard shots could be generated from the script");
    }

    await shotRepo.deleteByProject(id);

    const shots = [];
    for (const shot of generatedShots) {
      const row = await shotRepo.create(id, shot);
      shots.push(row);
    }

    return ok(shots);
  } catch (e) {
    if (NoOutputGeneratedError.isInstance(e)) {
      return badRequest("AI did not return valid structured storyboard data. Retry or simplify the script content.");
    }
    return serverError(e);
  }
}
