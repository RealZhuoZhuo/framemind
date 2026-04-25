import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { projectAssets, projects, projectSteps, shotAssets, shots, videoClips } from "./schema";

export type ProjectRow = InferSelectModel<typeof projects>;
export type ProjectInsert = InferInsertModel<typeof projects>;

export type StepRow = InferSelectModel<typeof projectSteps>;
export type StepInsert = InferInsertModel<typeof projectSteps>;

export type AssetType = "character" | "scene" | "prop";
export type AssetRow = InferSelectModel<typeof projectAssets> & { type: AssetType };
export type AssetInsert = InferInsertModel<typeof projectAssets>;

export type ShotRow = InferSelectModel<typeof shots>;
export type ShotInsert = InferInsertModel<typeof shots>;
export type ShotAssetRow = InferSelectModel<typeof shotAssets>;
export type ShotWithAssets = ShotRow & {
  assetIds: string[];
  assets: AssetRow[];
};

export type VideoClipRow = InferSelectModel<typeof videoClips>;
export type VideoClipInsert = InferInsertModel<typeof videoClips>;
