import { getStorage } from "@/lib/storage";
import { ok, badRequest, serverError } from "@/app/api/_helpers/api-response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) return badRequest("key query parameter is required");

    // Ensure the key belongs to this project (prevent cross-project access)
    if (!key.startsWith(`projects/${id}/`)) {
      return badRequest("key does not belong to this project");
    }

    const ttl = Number(searchParams.get("ttl") ?? 3600);
    const storage = getStorage();
    const url = await storage.presign(key, ttl);
    return ok({ url, expiresIn: ttl });
  } catch (e) {
    return serverError(e);
  }
}
