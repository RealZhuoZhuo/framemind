import { characterRepo } from "@/lib/repositories";
import { notFound } from "@/app/api/_helpers/api-response";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  const { id, cid } = await params;
  const character = await characterRepo.findById(cid);
  if (!character || character.projectId !== id) {
    return notFound("Character not found");
  }

  return Response.json(
    { error: "Character image generation is not implemented yet." },
    { status: 501 }
  );
}
