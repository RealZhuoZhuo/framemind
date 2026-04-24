import { shotRepo } from "@/lib/repositories";
import { notFound } from "@/app/api/_helpers/api-response";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { id, sid } = await params;
  const shot = await shotRepo.findById(sid);
  if (!shot || shot.projectId !== id) {
    return notFound("Shot not found");
  }

  return Response.json(
    { error: "Shot video generation is not implemented yet." },
    { status: 501 }
  );
}
