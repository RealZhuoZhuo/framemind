import { videoGenerationTaskRepo } from "@/lib/repositories";
import { ok, serverError } from "@/app/api/_helpers/api-response";
import { formatVideoGenerationTask } from "@/lib/ai/video/task-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tasks = await videoGenerationTaskRepo.findActiveByProject(id);
    return ok(await Promise.all(tasks.map((task) => formatVideoGenerationTask(task))));
  } catch (e) {
    return serverError(e);
  }
}
