import { characterRepo } from "@/lib/repositories";
import { ok, created, badRequest, serverError } from "@/app/api/_helpers/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const body = await request.json();
    const { name, appearance, clothing, description } = body;

    if (!name || typeof name !== "string") return badRequest("name is required");

    const character = await characterRepo.create(id, { name, appearance, clothing, description });
    return created(character);
  } catch (e) {
    return serverError(e);
  }
}
