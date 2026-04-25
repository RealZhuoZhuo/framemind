import type { AssetRow, AssetType } from "@/lib/db/types";

export interface IAssetRepository {
  findByProject(projectId: string): Promise<AssetRow[]>;
  findById(id: string): Promise<AssetRow | null>;
  create(projectId: string, data: CreateAssetInput): Promise<AssetRow>;
  update(id: string, data: UpdateAssetInput): Promise<AssetRow | null>;
  delete(id: string): Promise<void>;
  deleteByProject(projectId: string): Promise<void>;
}

export type CreateAssetInput = {
  type: AssetType;
  name: string;
  appearance?: string;
  description?: string;
  mediaUrl?: string | null;
};

export type UpdateAssetInput = Partial<CreateAssetInput>;
