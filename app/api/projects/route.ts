import { projectRepo, stepRepo } from "@/lib/repositories";
import { ok, created, badRequest, serverError } from "@/app/api/_helpers/api-response";

export async function GET() {
  try {
    const projects = await projectRepo.findAll();
    return ok(projects);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, gradient, videoMode, aspectRatio, visualStyle } = body;

    if (!gradient || typeof gradient !== "string") {
      return badRequest("gradient is required");
    }

    const project = await projectRepo.create({ title, gradient, videoMode, aspectRatio, visualStyle });
    await stepRepo.initForProject(project.id);
    return created(project);
  } catch (e) {
    return serverError(e);
  }
}
