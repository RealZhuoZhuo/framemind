import type { AssetRow, AssetType } from "@/lib/db/types";
import type { SCENE_TYPES } from "@/lib/storyboard/constants";

export type GeneratedAssetRow = {
  type: AssetType;
  name: string;
  appearance: string;
  description: string;
  mediaUrl: string;
};

export type GeneratedShotRow = {
  shotNumber: number;
  sceneType: (typeof SCENE_TYPES)[number] | "";
  assetIds: string[];
  shotDescription: string;
  dialogueSpeaker: string;
  dialogue: string;
  characterAction: string;
  lightingMood: string;
  mediaUrl: string;
};

export interface ITextGenerationService {
  extractAssetsFromScript(script: string): Promise<GeneratedAssetRow[]>;
  generateShotsFromScript(script: string, assets: AssetRow[]): Promise<GeneratedShotRow[]>;
}
