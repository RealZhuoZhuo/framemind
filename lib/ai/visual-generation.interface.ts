export type CharacterImageGenerationInput = {
  projectId: string;
  characterId: string;
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
  generateCharacterImage(input: CharacterImageGenerationInput): Promise<{ mediaUrl: string | null }>;
  generateShotImage(input: ShotImageGenerationInput): Promise<{ mediaUrl: string | null }>;
  generateShotVideo(input: ShotVideoGenerationInput): Promise<{ mediaUrl: string | null }>;
}

export class StubVisualGenerationService implements IVisualGenerationService {
  async generateCharacterImage(): Promise<{ mediaUrl: string | null }> {
    throw new Error("Character image generation is not implemented yet.");
  }

  async generateShotImage(): Promise<{ mediaUrl: string | null }> {
    throw new Error("Shot image generation is not implemented yet.");
  }

  async generateShotVideo(): Promise<{ mediaUrl: string | null }> {
    throw new Error("Shot video generation is not implemented yet.");
  }
}
