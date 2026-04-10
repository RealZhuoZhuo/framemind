import type { VideoClipRow } from "@/lib/db/types";

export type ClipType = "video" | "subtitle" | "audio";

export interface IVideoClipRepository {
  findByProject(projectId: string): Promise<VideoClipRow[]>;
  findById(id: string): Promise<VideoClipRow | null>;
  create(projectId: string, data: CreateClipInput): Promise<VideoClipRow>;
  update(id: string, data: UpdateClipInput): Promise<VideoClipRow | null>;
  delete(id: string): Promise<void>;
  replaceAll(projectId: string, clips: CreateClipInput[]): Promise<VideoClipRow[]>;
}

export type CreateClipInput = {
  clipType: ClipType;
  startSec: number;
  endSec: number;
  label?: string;
  url?: string | null;
  subtitleText?: string | null;
};

export type UpdateClipInput = Partial<CreateClipInput>;
