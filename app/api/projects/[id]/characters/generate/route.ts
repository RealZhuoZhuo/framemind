import { ok, badRequest, notFound, serverError } from "@/app/api/_helpers/api-response";
import { extractCharactersFromScript } from "@/lib/ai/story-pipeline";
import { getProjectScript } from "@/lib/ai/project-script";
import { characterRepo, projectRepo } from "@/lib/repositories";

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

    const generatedCharacters = await extractCharactersFromScript(script);
    if (generatedCharacters.length === 0) {
      return badRequest("No main characters could be extracted from the script");
    }

    await characterRepo.deleteByProject(id);

    const characters = [];
    for (const character of generatedCharacters) {
      const row = await characterRepo.create(id, character);
      characters.push(row);
    }

    return ok(characters);
  } catch (e) {
    return serverError(e);
  }
}
