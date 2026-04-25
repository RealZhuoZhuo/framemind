import { assetRepo, shotRepo } from "@/lib/repositories";
import { ok, created, badRequest, serverError } from "@/app/api/_helpers/api-response";

async function normalizeProjectAssetIds(projectId: string, rawAssetIds: unknown) {
  if (rawAssetIds === undefined) return [];
  if (!Array.isArray(rawAssetIds)) throw new Error("assetIds must be an array");

  const requestedIds = [...new Set(rawAssetIds.map(String).filter(Boolean))];
  if (requestedIds.length === 0) return [];

  const assets = await assetRepo.findByProject(projectId);
  const allowedIds = new Set(assets.map((asset) => asset.id));
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
    const { shotNumber, sceneType, shotDescription, assetIds, dialogueSpeaker, dialogue, characterAction, lightingMood, mediaUrl } = body;

    if (shotNumber !== undefined && typeof shotNumber !== "number") {
      return badRequest("shotNumber must be a number");
    }
    let normalizedAssetIds: string[];
    try {
      normalizedAssetIds = await normalizeProjectAssetIds(id, assetIds);
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : "Invalid assetIds");
    }

    const shot = await shotRepo.create(id, {
      shotNumber,
      sceneType,
      shotDescription,
      assetIds: normalizedAssetIds,
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
