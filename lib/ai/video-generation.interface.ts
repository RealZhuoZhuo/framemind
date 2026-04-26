export type VideoGenerationResolution = "480p" | "720p" | "1080p";

export type VideoGenerationRatio =
  | "16:9"
  | "4:3"
  | "1:1"
  | "3:4"
  | "9:16"
  | "21:9"
  | "adaptive";

export type VideoGenerationStatus =
  | "queued"
  | "running"
  | "cancelled"
  | "succeeded"
  | "failed"
  | "expired"
  | "unknown";

export type VideoGenerationError = {
  code?: string;
  message?: string;
};

export type VideoGenerationCreateInput = {
  prompt: string;
  firstFrameUrl: string;
  resolution?: VideoGenerationResolution;
  ratio?: VideoGenerationRatio;
  duration?: number;
  seed?: number;
  generateAudio?: boolean;
  returnLastFrame?: boolean;
};

export type VideoGenerationCreateOutput = {
  taskId: string;
  provider: string;
  model: string;
  status: VideoGenerationStatus;
};

export type VideoGenerationTaskOutput = {
  taskId: string;
  provider: string;
  model: string;
  status: VideoGenerationStatus;
  videoUrl?: string;
  lastFrameUrl?: string;
  error?: VideoGenerationError | null;
  metadata: Record<string, unknown>;
};

export interface IVideoGenerationProvider {
  createVideoTask(input: VideoGenerationCreateInput): Promise<VideoGenerationCreateOutput>;
  getVideoTask(taskId: string): Promise<VideoGenerationTaskOutput>;
}
