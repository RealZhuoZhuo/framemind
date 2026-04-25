export type AssetImageGenerationInput = {
  projectId: string;
  assetId: string;
};

export type ShotImageGenerationInput = {
  projectId: string;
  shotId: string;
};

export type ShotVideoGenerationInput = {
  projectId: string;
  shotId: string;
};

export interface IVisualGenerationService {
  generateAssetImage(input: AssetImageGenerationInput): Promise<{ mediaUrl: string | null }>;
  generateShotImage(input: ShotImageGenerationInput): Promise<{ mediaUrl: string | null }>;
  generateShotVideo(input: ShotVideoGenerationInput): Promise<{ mediaUrl: string | null }>;
}

export class StubVisualGenerationService implements IVisualGenerationService {
  async generateAssetImage(): Promise<{ mediaUrl: string | null }> {
    throw new Error("Asset image generation is not implemented yet.");
  }

  async generateShotImage(): Promise<{ mediaUrl: string | null }> {
    throw new Error("Shot image generation is not implemented yet.");
  }

  async generateShotVideo(): Promise<{ mediaUrl: string | null }> {
    throw new Error("Shot video generation is not implemented yet.");
  }
}
