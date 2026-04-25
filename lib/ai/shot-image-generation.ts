import { getImageGenerationProvider } from "@/lib/ai/image-generation-provider";
import { getStorage } from "@/lib/storage";
import type { CharacterRow, ShotRow } from "@/lib/db/types";

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function collectShotCharacters(shot: ShotRow, characters: CharacterRow[]) {
  const selected = new Map<string, CharacterRow>();

  if (shot.characterId) {
    const primary = characters.find((character) => character.id === shot.characterId);
    if (primary) selected.set(primary.id, primary);
  }

  const searchableText = [
    shot.characterAction,
    shot.dialogue,
    shot.lightingMood,
  ].join("\n");
  const normalizedText = normalizeName(searchableText);

  for (const character of characters) {
    const name = character.name.trim();
    if (!name) continue;

    if (searchableText.includes(name) || normalizedText.includes(normalizeName(name))) {
      selected.set(character.id, character);
    }
  }

  return [...selected.values()];
}

function buildShotImagePrompt(shot: ShotRow, referencedCharacters: CharacterRow[]) {
  const characterLines = referencedCharacters.map((character, index) => {
    const refIndex = index + 1;
    return [
      `图${refIndex}对应角色：${character.name}`,
      character.appearance ? `外貌：${character.appearance}` : "",
      character.description ? `设定：${character.description}` : "",
      "生成时必须参考该图保持角色脸型、发型、服装轮廓、年龄感和整体画风一致。",
    ].filter(Boolean).join("；");
  });

  return [
    "请根据提供的参考图生成一张影视分镜画面。图1、图2等分别是不同角色的形象参考；画面必须保持对应角色身份、外貌和统一视觉风格，不要重新设计角色。",
    referencedCharacters.length > 0 ? "角色参考说明：" : "",
    ...characterLines,
    "",
    `镜号：${shot.shotNumber}`,
    shot.sceneType ? `景别：${shot.sceneType}` : "",
    shot.characterAction ? `画面动作与构图：${shot.characterAction}` : "",
    shot.dialogue ? `台词/情绪：${shot.dialogue}` : "",
    shot.lightingMood ? `氛围光影：${shot.lightingMood}` : "",
    "要求：电影感构图，主体清晰，角色关系明确，光影统一，色彩层次细腻，不要文字、水印、畸形肢体、额外无关角色。",
  ].filter(Boolean).join("\n");
}

function extensionFromContentType(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

export async function generateShotImageToStorage(shot: ShotRow, characters: CharacterRow[]) {
  const referencedCharacters = collectShotCharacters(shot, characters).filter(
    (character) => character.mediaUrl
  );
  const referenceImages = referencedCharacters.map((character) => ({
    url: character.mediaUrl as string,
    label: character.name,
  }));
  const prompt = buildShotImagePrompt(shot, referencedCharacters);
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
