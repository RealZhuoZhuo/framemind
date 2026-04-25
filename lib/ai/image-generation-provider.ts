import { ArkImageGenerationProvider } from "@/lib/ai/ark-image-generation";
import type { IImageGenerationProvider } from "@/lib/ai/image-generation.interface";

export function getImageGenerationProvider(): IImageGenerationProvider {
  const provider = process.env.IMAGE_GENERATION_PROVIDER?.trim() || "ark";

  if (provider === "ark") {
    return new ArkImageGenerationProvider();
  }

  throw new Error(`Unknown IMAGE_GENERATION_PROVIDER: "${provider}". Supported: "ark"`);
}
