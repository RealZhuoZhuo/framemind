import type { ShotWithAssets } from "@/lib/db/types";

export interface IShotRepository {
  findByProject(projectId: string): Promise<ShotWithAssets[]>;
  findById(id: string): Promise<ShotWithAssets | null>;
  create(projectId: string, data: CreateShotInput): Promise<ShotWithAssets>;
  update(id: string, data: UpdateShotInput): Promise<ShotWithAssets | null>;
  delete(id: string): Promise<void>;
  deleteByProject(projectId: string): Promise<void>;
  setAssets(shotId: string, assetIds: string[]): Promise<void>;
  setDialogueSpeakers(shotId: string, assetIds: string[]): Promise<void>;
  findAssetsByShot(shotId: string): Promise<ShotWithAssets["assets"]>;
  findDialogueSpeakersByShot(shotId: string): Promise<ShotWithAssets["dialogueSpeakers"]>;
}

export type CreateShotInput = {
  shotNumber?: number;
  sceneType?: string;
  shotDescription?: string;
  assetIds?: string[];
  dialogueSpeakerIds?: string[];
  dialogueSpeaker?: string;
  dialogue?: string;
  characterAction?: string;
  lightingMood?: string;
  mediaUrl?: string | null;
};

export type UpdateShotInput = Partial<Omit<CreateShotInput, "assetIds" | "dialogueSpeakerIds">>;
