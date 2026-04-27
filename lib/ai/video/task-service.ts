import { buildShotVideoPrompt } from "./prompts";
import { getVideoGenerationProvider } from "./generation-provider";
import { getStorage } from "@/lib/storage";
import { signMediaUrl } from "@/lib/storage/media-url";
import { shotRepo, videoClipRepo, videoGenerationTaskRepo } from "@/lib/repositories";
import type { ShotWithAssets, VideoGenerationTaskRow } from "@/lib/db/types";
import type {
  VideoGenerationCreateInput,
  VideoGenerationResolution,
  VideoGenerationRatio,
  VideoGenerationStatus,
  VideoGenerationTaskOutput,
} from "./interfaces/video-generation.interface";
import type { VideoGenerationTaskStatus } from "@/lib/repositories/interfaces/video-generation-task.repository";

const DEFAULT_GENERATED_VIDEO_DURATION_SECONDS = 5;

export type ShotVideoTaskCreateOptions = Partial<
  Pick<
    VideoGenerationCreateInput,
    "prompt" | "resolution" | "ratio" | "duration" | "seed" | "generateAudio" | "returnLastFrame"
  >
> & {
  resolution?: VideoGenerationResolution;
  ratio?: VideoGenerationRatio;
};

export type VideoGenerationTaskDto = {
  id: string;
  taskId: string;
  projectId: string;
  shotId: string;
  providerTaskId: string;
  provider: string;
  model: string;
  status: VideoGenerationStatus;
  prompt: string;
  videoUrl: string | null;
  mediaUrl: string | null;
  lastFrameUrl: string | null;
  error: {
    code?: string;
    message?: string;
  } | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export function isActiveVideoGenerationStatus(status: string) {
  return status === "queued" || status === "running" || status === "unknown";
}

function asVideoGenerationStatus(status: string): VideoGenerationStatus {
  if (
    status === "queued" ||
    status === "running" ||
    status === "cancelled" ||
    status === "succeeded" ||
    status === "failed" ||
    status === "expired" ||
    status === "unknown"
  ) {
    return status;
  }

  return "unknown";
}

function contentTypeToExtension(contentType: string) {
  const lower = contentType.toLowerCase();
  if (lower.includes("webm")) return "webm";
  if (lower.includes("quicktime")) return "mov";
  if (lower.includes("mpeg")) return "mpeg";
  return "mp4";
}

function durationFromMetadata(metadata: Record<string, unknown>) {
  const raw = metadata.duration;
  const duration = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  return Number.isFinite(duration) && duration > 0
    ? duration
    : DEFAULT_GENERATED_VIDEO_DURATION_SECONDS;
}

function clipDuration(startSec: number, endSec: number) {
  const duration = endSec - startSec;
  return Number.isFinite(duration) && duration > 0 ? duration : DEFAULT_GENERATED_VIDEO_DURATION_SECONDS;
}

export async function formatVideoGenerationTask(row: VideoGenerationTaskRow): Promise<VideoGenerationTaskDto> {
  const mediaUrl = row.mediaUrl ? await signMediaUrl(row.mediaUrl) : null;

  return {
    id: row.id,
    taskId: row.id,
    projectId: row.projectId,
    shotId: row.shotId,
    providerTaskId: row.providerTaskId,
    provider: row.provider,
    model: row.model,
    status: asVideoGenerationStatus(row.status),
    prompt: row.prompt,
    videoUrl: row.videoUrl,
    mediaUrl,
    lastFrameUrl: row.lastFrameUrl,
    error: row.errorCode || row.errorMessage
      ? {
          ...(row.errorCode ? { code: row.errorCode } : {}),
          ...(row.errorMessage ? { message: row.errorMessage } : {}),
        }
      : null,
    metadata: row.metadata ?? {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function downloadVideoToStorage(projectId: string, shotId: string, videoUrl: string) {
  const videoResponse = await fetch(videoUrl, { cache: "no-store" });
  if (!videoResponse.ok) {
    throw new Error(`Failed to download generated video: ${videoResponse.status}`);
  }

  const contentType = videoResponse.headers.get("content-type") || "video/mp4";
  const buffer = Buffer.from(await videoResponse.arrayBuffer());
  const ext = contentTypeToExtension(contentType);
  const key = `projects/${projectId}/video/shots/${shotId}-${Date.now()}.${ext}`;

  return getStorage().upload(key, buffer, contentType);
}

async function reorderGeneratedVideoClips(projectId: string) {
  const [shots, clips] = await Promise.all([
    shotRepo.findByProject(projectId),
    videoClipRepo.findByProject(projectId),
  ]);
  const shotOrder = new Map(shots.map((shot, index) => [shot.id, { shotNumber: shot.shotNumber, index }]));
  const generatedClips = clips
    .filter((clip) => clip.clipType === "video" && clip.sourceShotId && shotOrder.has(clip.sourceShotId))
    .sort((a, b) => {
      const aOrder = shotOrder.get(a.sourceShotId as string);
      const bOrder = shotOrder.get(b.sourceShotId as string);
      return (aOrder?.shotNumber ?? aOrder?.index ?? 0) - (bOrder?.shotNumber ?? bOrder?.index ?? 0);
    });

  let cursor = 0;
  for (const clip of generatedClips) {
    const duration = clipDuration(clip.startSec, clip.endSec);
    const nextStart = cursor;
    const nextEnd = cursor + duration;
    cursor = nextEnd;

    if (clip.startSec !== nextStart || clip.endSec !== nextEnd) {
      await videoClipRepo.update(clip.id, {
        startSec: nextStart,
        endSec: nextEnd,
      });
    }
  }
}

async function finalizeSucceededTask(row: VideoGenerationTaskRow, providerTask: VideoGenerationTaskOutput) {
  if (!providerTask.videoUrl) {
    return videoGenerationTaskRepo.update(row.id, {
      status: "failed",
      errorCode: "missing_video_url",
      errorMessage: "Video generation succeeded but did not return a video URL.",
      metadata: providerTask.metadata,
      lastFrameUrl: providerTask.lastFrameUrl ?? null,
    });
  }

  const shot = await shotRepo.findById(row.shotId);
  if (!shot || shot.projectId !== row.projectId) {
    return videoGenerationTaskRepo.update(row.id, {
      status: "failed",
      errorCode: "shot_not_found",
      errorMessage: "Shot not found while finalizing generated video.",
      metadata: providerTask.metadata,
      videoUrl: providerTask.videoUrl,
      lastFrameUrl: providerTask.lastFrameUrl ?? null,
    });
  }

  const mediaUrl = row.mediaUrl || await downloadVideoToStorage(row.projectId, row.shotId, providerTask.videoUrl);
  const duration = durationFromMetadata(providerTask.metadata);

  await shotRepo.update(row.shotId, { mediaUrl });
  await videoClipRepo.upsertVideoBySourceShot(row.projectId, row.shotId, {
    clipType: "video",
    startSec: 0,
    endSec: duration,
    mediaUrl,
    label: `镜头 ${shot.shotNumber}`,
    sourceShotId: row.shotId,
  });
  await reorderGeneratedVideoClips(row.projectId);

  return videoGenerationTaskRepo.update(row.id, {
    status: "succeeded",
    videoUrl: providerTask.videoUrl,
    mediaUrl,
    lastFrameUrl: providerTask.lastFrameUrl ?? null,
    errorCode: null,
    errorMessage: null,
    metadata: providerTask.metadata,
  });
}

export async function createShotVideoGenerationTask(
  shot: ShotWithAssets,
  firstFrameUrl: string,
  options: ShotVideoTaskCreateOptions
) {
  const prompt = options.prompt?.trim() || buildShotVideoPrompt(shot);
  const providerTask = await getVideoGenerationProvider().createVideoTask({
    prompt,
    firstFrameUrl,
    resolution: options.resolution,
    ratio: options.ratio,
    duration: options.duration,
    seed: options.seed,
    generateAudio: options.generateAudio,
    returnLastFrame: options.returnLastFrame,
  });

  const row = await videoGenerationTaskRepo.create({
    projectId: shot.projectId,
    shotId: shot.id,
    providerTaskId: providerTask.taskId,
    provider: providerTask.provider,
    model: providerTask.model,
    status: providerTask.status as VideoGenerationTaskStatus,
    prompt,
  });

  return formatVideoGenerationTask(row);
}

export async function findVideoGenerationTask(taskIdOrProviderTaskId: string) {
  return (
    await videoGenerationTaskRepo.findById(taskIdOrProviderTaskId)
  ) ?? videoGenerationTaskRepo.findByProviderTaskId(taskIdOrProviderTaskId);
}

export async function syncVideoGenerationTask(row: VideoGenerationTaskRow) {
  if (row.status === "succeeded" && row.mediaUrl) {
    return formatVideoGenerationTask(row);
  }

  const providerTask = await getVideoGenerationProvider().getVideoTask(row.providerTaskId);

  if (providerTask.status === "succeeded") {
    const finalized = await finalizeSucceededTask(row, providerTask);
    if (!finalized) {
      throw new Error("Failed to update finalized video generation task.");
    }
    return formatVideoGenerationTask(finalized);
  }

  const updated = await videoGenerationTaskRepo.update(row.id, {
    status: providerTask.status as VideoGenerationTaskStatus,
    videoUrl: providerTask.videoUrl ?? row.videoUrl,
    lastFrameUrl: providerTask.lastFrameUrl ?? row.lastFrameUrl,
    errorCode: providerTask.error?.code ?? null,
    errorMessage: providerTask.error?.message ?? null,
    metadata: providerTask.metadata,
  });

  if (!updated) {
    throw new Error("Failed to update video generation task.");
  }

  return formatVideoGenerationTask(updated);
}
