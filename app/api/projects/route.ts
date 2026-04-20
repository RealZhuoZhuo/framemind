import { projectRepo, stepRepo } from "@/lib/repositories";
import { ok, created, serverError } from "@/app/api/_helpers/api-response";

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
    const { title, videoMode, aspectRatio, visualStyle } = body;

    const project = await projectRepo.create({ title, videoMode, aspectRatio, visualStyle });
    await stepRepo.initForProject(project.id);
    return created(project);
  } catch (e) {
    return serverError(e);
  }
}
