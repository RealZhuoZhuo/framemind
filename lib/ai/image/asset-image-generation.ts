import { getImageGenerationProvider } from "./generation-provider";
import { buildAssetImagePrompt } from "./prompts";
import { getStorage } from "@/lib/storage";
import type { AssetRow } from "@/lib/db/types";

function extensionFromContentType(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

export async function generateAssetImageToStorage(asset: AssetRow) {
  const prompt = buildAssetImagePrompt(asset);
  const generated = await getImageGenerationProvider().generateImage({ prompt });

  const imageResponse = await fetch(generated.url);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download generated image: ${imageResponse.status}`);
  }

  const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  const ext = extensionFromContentType(contentType);
  const key = `projects/${asset.projectId}/image/assets/${asset.id}-${Date.now()}.${ext}`;
  const mediaUrl = await getStorage().upload(key, buffer, contentType);

  return { mediaUrl, sourceUrl: generated.url, prompt, provider: generated.provider, model: generated.model };
}
