import { getImageGenerationProvider } from "@/lib/ai/image-generation-provider";
import { getStorage } from "@/lib/storage";
import type { AssetRow } from "@/lib/db/types";

function assetTypeLabel(type: AssetRow["type"]) {
  if (type === "character") return "角色";
  if (type === "scene") return "场景";
  return "道具";
}

function buildAssetImagePrompt(asset: AssetRow) {
  const typeLabel = assetTypeLabel(asset.type);
  const baseByType: Record<AssetRow["type"], string> = {
    character: "影视级角色概念设计，单人角色定妆参考图，主体清晰，完整展现人物外貌、服装、气质和辨识度。",
    scene: "影视级场景概念设计，空间结构清晰，完整展现地点、时代风格、关键陈设、光影氛围和调度空间。",
    prop: "影视级道具概念设计，单个核心物件清晰，完整展现形态、材质、尺寸感、用途和辨识细节。",
  };

  const parts = [
    baseByType[asset.type],
    `资产类型：${typeLabel}`,
    `资产名称：${asset.name}`,
    asset.appearance ? `视觉描述：${asset.appearance}` : "",
    asset.description ? `详细设定：${asset.description}` : "",
    "高质量视觉设定参考图，真实质感，电影光影，细腻色彩层次，构图稳定，避免文字、水印、畸形结构和无关主体。",
  ];

  return parts.filter(Boolean).join("\n");
}

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
