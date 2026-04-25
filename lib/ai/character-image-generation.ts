import { getImageGenerationProvider } from "@/lib/ai/image-generation-provider";
import { getStorage } from "@/lib/storage";
import type { CharacterRow } from "@/lib/db/types";

function buildCharacterImagePrompt(character: CharacterRow) {
  const parts = [
    "影视级角色概念设计，单人角色定妆照，主体清晰，完整展现人物外貌、服装、气质和辨识度。",
    `角色名称：${character.name}`,
    character.appearance ? `外貌形象：${character.appearance}` : "",
    character.description ? `角色描述：${character.description}` : "",
    "高质量角色设定图，真实质感，电影光影，细腻色彩层次，构图稳定，背景简洁但有氛围，避免文字、水印、多人、畸形肢体。",
  ];

  return parts.filter(Boolean).join("\n");
}

function extensionFromContentType(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

export async function generateCharacterImageToStorage(character: CharacterRow) {
  const prompt = buildCharacterImagePrompt(character);
  const generated = await getImageGenerationProvider().generateImage({ prompt });

  const imageResponse = await fetch(generated.url);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download generated image: ${imageResponse.status}`);
  }

  const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  const ext = extensionFromContentType(contentType);
  const key = `projects/${character.projectId}/image/characters/${character.id}-${Date.now()}.${ext}`;
  const mediaUrl = await getStorage().upload(key, buffer, contentType);

  return { mediaUrl, sourceUrl: generated.url, prompt, provider: generated.provider, model: generated.model };
}
