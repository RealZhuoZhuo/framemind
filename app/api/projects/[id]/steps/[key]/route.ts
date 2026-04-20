import { projectRepo, stepRepo } from "@/lib/repositories";
import { ok, badRequest, notFound, serverError } from "@/app/api/_helpers/api-response";
import type { StepKey } from "@/lib/repositories/interfaces/step.repository";

const VALID_KEYS: StepKey[] = ["script", "character", "storyboard", "video"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; key: string }> }
) {
  try {
    const { id, key } = await params;
    const project = await projectRepo.findById(id);
    if (!project) return notFound("Project not found");

    if (!VALID_KEYS.includes(key as StepKey)) {
      return badRequest(`Invalid step key: ${key}`);
    }

    const body = await request.json();
    const { content, completed } = body;

    const step = await stepRepo.upsert(id, key as StepKey, { content, completed });
    return ok(step);
  } catch (e) {
    return serverError(e);
  }
}
