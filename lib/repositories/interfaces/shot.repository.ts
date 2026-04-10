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
  description?: string;
  sceneType?: string;
  cameraAngle?: string;
  narration?: string;
  characterId?: string | null;
  dialogue?: string;
  notes?: string;
};

export type UpdateShotInput = Partial<
  CreateShotInput & {
    imageGenerated: boolean;
    imageUrl: string | null;
  }
>;
