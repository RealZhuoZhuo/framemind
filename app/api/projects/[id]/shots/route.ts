import { assetRepo, shotRepo } from "@/lib/repositories";
import { ok, created, badRequest, serverError } from "@/app/api/_helpers/api-response";

async function normalizeProjectAssetIds(
  projectId: string,
  rawAssetIds: unknown,
  options: { fieldName?: string; characterOnly?: boolean } = {}
) {
  if (rawAssetIds === undefined) return [];
  const fieldName = options.fieldName ?? "assetIds";
  if (!Array.isArray(rawAssetIds)) throw new Error(`${fieldName} must be an array`);

  const requestedIds = [...new Set(rawAssetIds.map(String).filter(Boolean))];
  if (requestedIds.length === 0) return [];

  const assets = await assetRepo.findByProject(projectId);
  const allowedIds = new Set(
    assets
      .filter((asset) => !options.characterOnly || asset.type === "character")
      .map((asset) => asset.id)
  );
  return requestedIds.filter((assetId) => allowedIds.has(assetId));
}

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
    const { shotNumber, sceneType, shotDescription, assetIds, dialogueSpeakerIds, dialogueSpeaker, dialogue, characterAction, lightingMood, mediaUrl } = body;

    if (shotNumber !== undefined && typeof shotNumber !== "number") {
      return badRequest("shotNumber must be a number");
    }
    let normalizedAssetIds: string[];
    let normalizedDialogueSpeakerIds: string[] | undefined;
    try {
      normalizedAssetIds = await normalizeProjectAssetIds(id, assetIds);
      normalizedDialogueSpeakerIds =
        dialogueSpeakerIds === undefined
          ? undefined
          : await normalizeProjectAssetIds(id, dialogueSpeakerIds, {
              fieldName: "dialogueSpeakerIds",
              characterOnly: true,
            });
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : "Invalid asset ids");
    }

    const shot = await shotRepo.create(id, {
      shotNumber,
      sceneType,
      shotDescription,
      assetIds: normalizedAssetIds,
      dialogueSpeakerIds: normalizedDialogueSpeakerIds,
      dialogueSpeaker,
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
