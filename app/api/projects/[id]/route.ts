import {
  projectRepo,
  stepRepo,
  characterRepo,
  shotRepo,
  videoClipRepo,
} from "@/lib/repositories";
import {
  ok,
  notFound,
  noContent,
  serverError,
} from "@/app/api/_helpers/api-response";
import type { StepKey } from "@/lib/repositories/interfaces/step.repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await projectRepo.findById(id);
    if (!project) return notFound("Project not found");

    const [stepsRows, characters, shots, clips] = await Promise.all([
      stepRepo.findByProject(id),
      characterRepo.findByProject(id),
      shotRepo.findByProject(id),
      videoClipRepo.findByProject(id),
    ]);

    const steps = Object.fromEntries(
      stepsRows.map((s) => [s.stepKey, { completed: s.completed, content: s.content }])
    ) as Record<StepKey, { completed: boolean; content: string }>;

    const videoClips = clips
      .filter((c) => c.clipType === "video")
      .map((c) => ({ id: c.id, start: c.startSec, end: c.endSec, mediaUrl: c.mediaUrl ?? "", label: c.label }));

    const subtitleClips = clips
      .filter((c) => c.clipType === "subtitle")
      .map((c) => ({ id: c.id, start: c.startSec, end: c.endSec, text: c.subtitleText ?? "" }));

    const audioClips = clips
      .filter((c) => c.clipType === "audio")
      .map((c) => ({ id: c.id, start: c.startSec, end: c.endSec, label: c.label }));

    return ok({
      ...project,
      steps,
      characters,
      shots,
      timeline: { videoClips, subtitleClips, audioClips },
    });
  } catch (e) {
    return serverError(e);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title } = body;

    const updated = await projectRepo.update(id, { title });
    if (!updated) return notFound("Project not found");
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await projectRepo.findById(id);
    if (!project) return notFound("Project not found");
    await projectRepo.delete(id);
    return noContent();
  } catch (e) {
    return serverError(e);
  }
}
