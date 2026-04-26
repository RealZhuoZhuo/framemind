export type ImageGenerationInput = {
  prompt: string;
  size?: string;
  referenceImages?: ImageReference[];
};

export type ImageGenerationOutput = {
  url: string;
  provider: string;
  model: string;
  size?: string;
};

export type ImageReference = {
  url: string;
  label?: string;
};

export interface IImageGenerationProvider {
  generateImage(input: ImageGenerationInput): Promise<ImageGenerationOutput>;
}
