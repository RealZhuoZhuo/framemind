import { videoClipRepo } from "@/lib/repositories";
import { ok, created, serverError } from "@/app/api/_helpers/api-response";
import type { ClipType } from "@/lib/repositories/interfaces/video-clip.repository";
import type { VideoClipRow } from "@/lib/db/types";

function formatTimeline(clips: VideoClipRow[]) {
  return {
    videoClips: clips
      .filter((c) => c.clipType === "video")
      .map((c) => ({ id: c.id, start: c.startSec, end: c.endSec, url: c.url ?? "", label: c.label })),
    subtitleClips: clips
      .filter((c) => c.clipType === "subtitle")
      .map((c) => ({ id: c.id, start: c.startSec, end: c.endSec, text: c.subtitleText ?? "" })),
    audioClips: clips
      .filter((c) => c.clipType === "audio")
      .map((c) => ({ id: c.id, start: c.startSec, end: c.endSec, label: c.label })),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clips = await videoClipRepo.findByProject(id);
    return ok(formatTimeline(clips));
  } catch (e) {
    return serverError(e);
  }
}

/** Full timeline replacement — sent on workspace save */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { videoClips = [], subtitleClips = [], audioClips = [] } = body;

    type RawVideo    = { start: number; end: number; url?: string; label?: string };
    type RawSubtitle = { start: number; end: number; text?: string };
    type RawAudio    = { start: number; end: number; label?: string };

    const allClips = [
      ...videoClips.map((c: RawVideo) => ({
        clipType: "video" as ClipType,
        startSec: c.start,
        endSec: c.end,
        url: c.url ?? null,
        label: c.label ?? "",
      })),
      ...subtitleClips.map((c: RawSubtitle) => ({
        clipType: "subtitle" as ClipType,
        startSec: c.start,
        endSec: c.end,
        subtitleText: c.text ?? null,
      })),
      ...audioClips.map((c: RawAudio) => ({
        clipType: "audio" as ClipType,
        startSec: c.start,
        endSec: c.end,
        label: c.label ?? "",
      })),
    ];

    const saved = await videoClipRepo.replaceAll(id, allClips);
    return ok(formatTimeline(saved));
  } catch (e) {
    return serverError(e);
  }
}

/** Add a single clip */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const clip = await videoClipRepo.create(id, body);
    return created(clip);
  } catch (e) {
    return serverError(e);
  }
}
