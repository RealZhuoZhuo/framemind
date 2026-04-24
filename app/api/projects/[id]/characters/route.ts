import { characterRepo, projectRepo } from "@/lib/repositories";
import { ok, created, badRequest, notFound, serverError } from "@/app/api/_helpers/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await projectRepo.findById(id);
    if (!project) return notFound("Project not found");
    const characters = await characterRepo.findByProject(id);
    return ok(characters);
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
    const project = await projectRepo.findById(id);
    if (!project) return notFound("Project not found");
    const body = await request.json();
    const { name, appearance, description, mediaUrl } = body;

    if (!name || typeof name !== "string") return badRequest("name is required");

    const character = await characterRepo.create(id, { name, appearance, description, mediaUrl });
    return created(character);
  } catch (e) {
    return serverError(e);
  }
}
