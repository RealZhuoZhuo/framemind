import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type * as schema from "./schema";

export type ProjectRow = InferSelectModel<typeof schema.projects>;
export type ProjectInsert = InferInsertModel<typeof schema.projects>;

export type StepRow = InferSelectModel<typeof schema.projectSteps>;
export type StepInsert = InferInsertModel<typeof schema.projectSteps>;

export type AssetType = "character" | "scene" | "prop";
export type AssetRow = InferSelectModel<typeof schema.projectAssets> & { type: AssetType };
export type AssetInsert = InferInsertModel<typeof schema.projectAssets>;

export type ShotRow = InferSelectModel<typeof schema.shots>;
export type ShotInsert = InferInsertModel<typeof schema.shots>;
export type ShotAssetRow = InferSelectModel<typeof schema.shotAssets>;
export type ShotWithAssets = ShotRow & {
  assetIds: string[];
  assets: AssetRow[];
};

export type VideoClipRow = InferSelectModel<typeof schema.videoClips>;
export type VideoClipInsert = InferInsertModel<typeof schema.videoClips>;
