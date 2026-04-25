import { characterRepo } from "@/lib/repositories";
import { generateCharacterImageToStorage } from "@/lib/ai/character-image-generation";
import { notFound, ok, serverError } from "@/app/api/_helpers/api-response";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const { id, cid } = await params;
    const character = await characterRepo.findById(cid);
    if (!character || character.projectId !== id) {
      return notFound("Character not found");
    }

    const { mediaUrl } = await generateCharacterImageToStorage(character);
    const updated = await characterRepo.update(cid, { mediaUrl });
    if (!updated) return notFound("Character not found");

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
