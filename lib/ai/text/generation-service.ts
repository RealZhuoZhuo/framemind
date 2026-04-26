import { StoryPipelineTextGenerationService } from "./story-pipeline";
import type { ITextGenerationService } from "./interfaces/text-generation.interface";

export function getTextGenerationService(): ITextGenerationService {
  return new StoryPipelineTextGenerationService();
}
