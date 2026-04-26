import { ArkSeedanceVideoGenerationProvider } from "@/lib/ai/ark-seedance-video-generation";
import type { IVideoGenerationProvider } from "@/lib/ai/video-generation.interface";

export function getVideoGenerationProvider(): IVideoGenerationProvider {
  const provider = process.env.VIDEO_GENERATION_PROVIDER?.trim() || "ark-seedance";

  if (provider === "ark-seedance") {
    return new ArkSeedanceVideoGenerationProvider();
  }

  throw new Error(
    `Unknown VIDEO_GENERATION_PROVIDER: "${provider}". Supported: "ark-seedance"`
  );
}
