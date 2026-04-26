import { getImageGenerationProvider } from "./generation-provider";
import { buildShotImagePrompt } from "./prompts";
import { getStorage } from "@/lib/storage";
import { signMediaUrl } from "@/lib/storage/media-url";
import type { AssetRow, ShotRow } from "@/lib/db/types";

function extensionFromContentType(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

export async function generateShotImageToStorage(shot: ShotRow, assets: AssetRow[]) {
  const referencedAssets = assets.filter((asset) => asset.mediaUrl);
  const referenceImages = await Promise.all(
    referencedAssets.map(async (asset) => ({
      url: (await signMediaUrl(asset.mediaUrl)) as string,
      label: asset.name,
    }))
  );
  const prompt = buildShotImagePrompt(shot, assets, referencedAssets);
  const generated = await getImageGenerationProvider().generateImage({ prompt, referenceImages });

  const imageResponse = await fetch(generated.url);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download generated shot image: ${imageResponse.status}`);
  }

  const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  const ext = extensionFromContentType(contentType);
  const key = `projects/${shot.projectId}/image/shots/${shot.id}-${Date.now()}.${ext}`;
  const mediaUrl = await getStorage().upload(key, buffer, contentType);

  return {
    mediaUrl,
    sourceUrl: generated.url,
    prompt,
    references: referenceImages,
    provider: generated.provider,
    model: generated.model,
  };
}
