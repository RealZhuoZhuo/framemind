import { shotRepo } from "@/lib/repositories";
import { badRequest, notFound, ok, serverError } from "@/app/api/_helpers/api-response";
import { buildShotVideoPrompt, getVideoGenerationProvider } from "@/lib/ai/video";
import { signMediaUrl } from "@/lib/storage/media-url";
import type {
  VideoGenerationRatio,
  VideoGenerationResolution,
} from "@/lib/ai/video";

const RESOLUTIONS = new Set<VideoGenerationResolution>(["480p", "720p", "1080p"]);
const RATIOS = new Set<VideoGenerationRatio>([
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
  "21:9",
  "adaptive",
]);

class RequestValidationError extends Error {}

type ShotVideoRequestBody = {
  prompt?: string;
  resolution?: VideoGenerationResolution;
  ratio?: VideoGenerationRatio;
  duration?: number;
  seed?: number;
  generateAudio?: boolean;
  returnLastFrame?: boolean;
};

async function readOptionalJson(request: Request): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (!text.trim()) return {};

  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new RequestValidationError("Request body must be a JSON object.");
  }

  return parsed as Record<string, unknown>;
}

function parseShotVideoRequestBody(raw: Record<string, unknown>): ShotVideoRequestBody {
  const body: ShotVideoRequestBody = {};

  if (raw.prompt !== undefined) {
    if (typeof raw.prompt !== "string") {
      throw new RequestValidationError("prompt must be a string.");
    }
    body.prompt = raw.prompt.trim();
  }

  if (raw.resolution !== undefined) {
    if (typeof raw.resolution !== "string" || !RESOLUTIONS.has(raw.resolution as VideoGenerationResolution)) {
      throw new RequestValidationError("resolution must be one of 480p, 720p, 1080p.");
    }
    body.resolution = raw.resolution as VideoGenerationResolution;
  }

  if (raw.ratio !== undefined) {
    if (typeof raw.ratio !== "string" || !RATIOS.has(raw.ratio as VideoGenerationRatio)) {
      throw new RequestValidationError("ratio is not supported.");
    }
    body.ratio = raw.ratio as VideoGenerationRatio;
  }

  if (raw.duration !== undefined) {
    if (typeof raw.duration !== "number" || !Number.isFinite(raw.duration)) {
      throw new RequestValidationError("duration must be a number.");
    }
    body.duration = raw.duration;
  }

  if (raw.seed !== undefined) {
    if (typeof raw.seed !== "number" || !Number.isInteger(raw.seed)) {
      throw new RequestValidationError("seed must be an integer.");
    }
    body.seed = raw.seed;
  }

  if (raw.generateAudio !== undefined) {
    if (typeof raw.generateAudio !== "boolean") {
      throw new RequestValidationError("generateAudio must be a boolean.");
    }
    body.generateAudio = raw.generateAudio;
  }

  if (raw.returnLastFrame !== undefined) {
    if (typeof raw.returnLastFrame !== "boolean") {
      throw new RequestValidationError("returnLastFrame must be a boolean.");
    }
    body.returnLastFrame = raw.returnLastFrame;
  }

  return body;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  try {
    const { id, sid } = await params;
    const shot = await shotRepo.findById(sid);
    if (!shot || shot.projectId !== id) {
      return notFound("Shot not found");
    }

    if (!shot.mediaUrl) {
      return badRequest("Shot image must be generated before video generation.");
    }

    const rawBody = await readOptionalJson(request);
    const body = parseShotVideoRequestBody(rawBody);
    const firstFrameUrl = await signMediaUrl(shot.mediaUrl);
    if (!firstFrameUrl) {
      return badRequest("Shot image URL is not available.");
    }

    const task = await getVideoGenerationProvider().createVideoTask({
      prompt: body.prompt || buildShotVideoPrompt(shot),
      firstFrameUrl,
      resolution: body.resolution,
      ratio: body.ratio,
      duration: body.duration,
      seed: body.seed,
      generateAudio: body.generateAudio,
      returnLastFrame: body.returnLastFrame,
    });

    return ok(task);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return badRequest("Invalid JSON body.");
    }
    if (e instanceof RequestValidationError) {
      return badRequest(e.message);
    }
    return serverError(e);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  try {
    const { id, sid } = await params;
    const shot = await shotRepo.findById(sid);
    if (!shot || shot.projectId !== id) {
      return notFound("Shot not found");
    }

    const taskId = new URL(request.url).searchParams.get("taskId")?.trim();
    if (!taskId) {
      return badRequest("taskId is required.");
    }

    const task = await getVideoGenerationProvider().getVideoTask(taskId);
    return ok(task);
  } catch (e) {
    return serverError(e);
  }
}
