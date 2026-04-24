import type { ShotRow } from "@/lib/db/types";

export interface IShotRepository {
  findByProject(projectId: string): Promise<ShotRow[]>;
  findById(id: string): Promise<ShotRow | null>;
  create(projectId: string, data: CreateShotInput): Promise<ShotRow>;
  update(id: string, data: UpdateShotInput): Promise<ShotRow | null>;
  delete(id: string): Promise<void>;
}

export type CreateShotInput = {
  shotNumber?: number;
  sceneType?: string;
  characterId?: string | null;
  dialogue?: string;
  characterAction?: string;
  lightingMood?: string;
  mediaUrl?: string | null;
};

export type UpdateShotInput = Partial<CreateShotInput>;
