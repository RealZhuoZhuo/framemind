import { shotRepo } from "@/lib/repositories";
import { ok, created, badRequest, serverError } from "@/app/api/_helpers/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shots = await shotRepo.findByProject(id);
    return ok(shots);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { shotNumber, sceneType, characterId, dialogue, characterAction, lightingMood, mediaUrl } = body;

    if (shotNumber !== undefined && typeof shotNumber !== "number") {
      return badRequest("shotNumber must be a number");
    }

    const shot = await shotRepo.create(id, {
      shotNumber,
      sceneType,
      characterId: characterId || null,
      dialogue,
      characterAction,
      lightingMood,
      mediaUrl: mediaUrl ?? null,
    });
    return created(shot);
  } catch (e) {
    return serverError(e);
  }
}
