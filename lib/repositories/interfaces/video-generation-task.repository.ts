import type { VideoGenerationTaskRow } from "@/lib/db/types";

export type VideoGenerationTaskStatus =
  | "queued"
  | "running"
  | "cancelled"
  | "succeeded"
  | "failed"
  | "expired"
  | "unknown";

export interface IVideoGenerationTaskRepository {
  findById(id: string): Promise<VideoGenerationTaskRow | null>;
  findByProviderTaskId(providerTaskId: string): Promise<VideoGenerationTaskRow | null>;
  findActiveByProject(projectId: string): Promise<VideoGenerationTaskRow[]>;
  create(data: CreateVideoGenerationTaskInput): Promise<VideoGenerationTaskRow>;
  update(id: string, data: UpdateVideoGenerationTaskInput): Promise<VideoGenerationTaskRow | null>;
}

export type CreateVideoGenerationTaskInput = {
  projectId: string;
  shotId: string;
  providerTaskId: string;
  provider: string;
  model: string;
  status: VideoGenerationTaskStatus;
  prompt: string;
  metadata?: Record<string, unknown>;
};

export type UpdateVideoGenerationTaskInput = Partial<{
  status: VideoGenerationTaskStatus;
  prompt: string;
  videoUrl: string | null;
  mediaUrl: string | null;
  lastFrameUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
}>;
