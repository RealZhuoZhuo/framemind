import { projectRepo, stepRepo } from "@/lib/repositories";
import { ok, notFound, serverError } from "@/app/api/_helpers/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await projectRepo.findById(id);
    if (!project) return notFound("Project not found");
    const steps = await stepRepo.findByProject(id);
    return ok(steps);
  } catch (e) {
    return serverError(e);
  }
}
