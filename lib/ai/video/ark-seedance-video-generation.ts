import type {
  IVideoGenerationProvider,
  VideoGenerationCreateInput,
  VideoGenerationCreateOutput,
  VideoGenerationError,
  VideoGenerationStatus,
  VideoGenerationTaskOutput,
} from "./interfaces/video-generation.interface";

const DEFAULT_SEEDANCE_MODEL = "doubao-seedance-1-5-pro-251215";
const DEFAULT_ARK_VIDEO_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks";

type ArkVideoTaskResponse = {
  id?: string;
  model?: string;
  status?: string;
  error?: VideoGenerationError | null;
  created_at?: number;
  updated_at?: number;
  content?: {
    video_url?: string;
    last_frame_url?: string;
  };
  seed?: number;
  resolution?: string;
  ratio?: string;
  duration?: number;
  frames?: number;
  framespersecond?: number;
  generate_audio?: boolean;
  draft?: boolean;
  draft_task_id?: string;
  service_tier?: string;
  execution_expires_after?: number;
  usage?: unknown;
};

function getArkVideoConfig() {
  const apiKey =
    process.env.ARK_VIDEO_API_KEY?.trim() ||
    process.env.ARK_API_KEY?.trim() ||
    process.env.VIDEO_GENERATION_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing ARK_VIDEO_API_KEY or ARK_API_KEY for video generation.");
  }

  return {
    apiKey,
    endpoint: process.env.ARK_VIDEO_ENDPOINT?.trim() || DEFAULT_ARK_VIDEO_ENDPOINT,
    model:
      process.env.VIDEO_GENERATION_MODEL?.trim() ||
      process.env.ARK_VIDEO_MODEL?.trim() ||
      DEFAULT_SEEDANCE_MODEL,
  };
}

function normalizeStatus(status: string | undefined): VideoGenerationStatus {
  if (
    status === "queued" ||
    status === "running" ||
    status === "cancelled" ||
    status === "succeeded" ||
    status === "failed" ||
    status === "expired"
  ) {
    return status;
  }

  return "unknown";
}

function metadataFromResponse(payload: ArkVideoTaskResponse): Record<string, unknown> {
  return {
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
    seed: payload.seed,
    resolution: payload.resolution,
    ratio: payload.ratio,
    duration: payload.duration,
    frames: payload.frames,
    framesPerSecond: payload.framespersecond,
    generateAudio: payload.generate_audio,
    draft: payload.draft,
    draftTaskId: payload.draft_task_id,
    serviceTier: payload.service_tier,
    executionExpiresAfter: payload.execution_expires_after,
    usage: payload.usage,
  };
}

export class ArkSeedanceVideoGenerationProvider implements IVideoGenerationProvider {
  async createVideoTask(input: VideoGenerationCreateInput): Promise<VideoGenerationCreateOutput> {
    const config = getArkVideoConfig();

    const body: Record<string, unknown> = {
      model: config.model,
      content: [
        {
          type: "text",
          text: input.prompt,
        },
        {
          type: "image_url",
          image_url: {
            url: input.firstFrameUrl,
          },
          role: "first_frame",
        },
      ],
      service_tier: "default",
      generate_audio: input.generateAudio ?? true,
      return_last_frame: input.returnLastFrame ?? false,
      watermark: false,
    };

    if (input.resolution) body.resolution = input.resolution;
    if (input.ratio) body.ratio = input.ratio;
    if (input.duration !== undefined) body.duration = input.duration;
    if (input.seed !== undefined) body.seed = input.seed;

    const generationResponse = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!generationResponse.ok) {
      const detail = await generationResponse.text().catch(() => "");
      throw new Error(`Ark video generation failed: ${generationResponse.status} ${detail}`);
    }

    const payload = (await generationResponse.json()) as ArkVideoTaskResponse;
    if (!payload.id) {
      throw new Error("Ark video generation response did not include a task ID.");
    }

    return {
      taskId: payload.id,
      provider: "ark-seedance",
      model: config.model,
      status: "queued",
    };
  }

  async getVideoTask(taskId: string): Promise<VideoGenerationTaskOutput> {
    const config = getArkVideoConfig();

    const taskResponse = await fetch(`${config.endpoint}/${encodeURIComponent(taskId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    if (!taskResponse.ok) {
      const detail = await taskResponse.text().catch(() => "");
      throw new Error(`Ark video task query failed: ${taskResponse.status} ${detail}`);
    }

    const payload = (await taskResponse.json()) as ArkVideoTaskResponse;

    return {
      taskId: payload.id || taskId,
      provider: "ark-seedance",
      model: payload.model || config.model,
      status: normalizeStatus(payload.status),
      videoUrl: payload.content?.video_url,
      lastFrameUrl: payload.content?.last_frame_url,
      error: payload.error ?? null,
      metadata: metadataFromResponse(payload),
    };
  }
}
