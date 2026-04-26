import { ArkSeedanceVideoGenerationProvider } from "./ark-seedance-video-generation";
import type { IVideoGenerationProvider } from "./generation.interface";

export function getVideoGenerationProvider(): IVideoGenerationProvider {
  const provider = process.env.VIDEO_GENERATION_PROVIDER?.trim() || "ark-seedance";

  if (provider === "ark-seedance") {
    return new ArkSeedanceVideoGenerationProvider();
  }

  throw new Error(
    `Unknown VIDEO_GENERATION_PROVIDER: "${provider}". Supported: "ark-seedance"`
  );
}
