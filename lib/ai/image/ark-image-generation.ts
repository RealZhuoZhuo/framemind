import type {
  IImageGenerationProvider,
  ImageGenerationInput,
  ImageGenerationOutput,
} from "./generation.interface";

const DEFAULT_ARK_IMAGE_MODEL = "ep-20260313204854-n5jb5";
const DEFAULT_ARK_IMAGE_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/images/generations";

type ArkImageGenerationResponse = {
  data?: Array<{
    url?: string;
    size?: string;
  }>;
};

function getArkImageConfig() {
  const apiKey =
    process.env.ARK_IMAGE_API_KEY?.trim() ||
    process.env.ARK_API_KEY?.trim() ||
    process.env.IMAGE_GENERATION_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing ARK_IMAGE_API_KEY for image generation.");
  }

  return {
    apiKey,
    endpoint: process.env.ARK_IMAGE_ENDPOINT?.trim() || DEFAULT_ARK_IMAGE_ENDPOINT,
    model:
      process.env.IMAGE_GENERATION_MODEL?.trim() ||
      process.env.ARK_IMAGE_MODEL?.trim() ||
      DEFAULT_ARK_IMAGE_MODEL,
    size:
      process.env.IMAGE_GENERATION_SIZE?.trim() ||
      process.env.ARK_IMAGE_SIZE?.trim() ||
      "2K",
  };
}

export class ArkImageGenerationProvider implements IImageGenerationProvider {
  async generateImage(input: ImageGenerationInput): Promise<ImageGenerationOutput> {
    const config = getArkImageConfig();

    const body: Record<string, unknown> = {
      model: config.model,
      prompt: input.prompt,
      sequential_image_generation: "disabled",
      response_format: "url",
      size: input.size || config.size,
      stream: false,
      watermark: false,
    };

    if (input.referenceImages?.length) {
      body.image = input.referenceImages.map((image) => image.url);
    }

    const generationResponse = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!generationResponse.ok) {
      const detail = await generationResponse.text().catch(() => "");
      throw new Error(`Ark image generation failed: ${generationResponse.status} ${detail}`);
    }

    const payload = (await generationResponse.json()) as ArkImageGenerationResponse;
    const generatedUrl = payload.data?.[0]?.url;
    if (!generatedUrl) {
      throw new Error("Ark image generation response did not include an image URL.");
    }

    return {
      url: generatedUrl,
      provider: "ark",
      model: config.model,
      size: payload.data?.[0]?.size,
    };
  }
}
