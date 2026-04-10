import { stepRepo } from "@/lib/repositories";
import { ok, serverError } from "@/app/api/_helpers/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const steps = await stepRepo.findByProject(id);
    return ok(steps);
  } catch (e) {
    return serverError(e);
  }
}
