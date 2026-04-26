import type { AssetRow, ShotRow } from "@/lib/db/types";

function assetTypeLabel(type: AssetRow["type"]) {
  if (type === "character") return "角色";
  if (type === "scene") return "场景";
  return "道具";
}

export function buildAssetImagePrompt(asset: AssetRow) {
  const typeLabel = assetTypeLabel(asset.type);
  const baseByType: Record<AssetRow["type"], string> = {
    character: "影视级角色概念设计，单人角色定妆参考图，主体清晰，完整展现人物外貌、服装、气质和辨识度。",
    scene: "影视级场景概念设计，空间结构清晰，完整展现地点、时代风格、关键陈设、光影氛围和调度空间。",
    prop: "影视级道具概念设计，单个核心物件清晰，完整展现形态、材质、尺寸感、用途和辨识细节。",
  };

  return [
    baseByType[asset.type],
    `资产类型：${typeLabel}`,
    `资产名称：${asset.name}`,
    asset.appearance ? `视觉描述：${asset.appearance}` : "",
    asset.description ? `详细设定：${asset.description}` : "",
    "高质量视觉设定参考图，真实质感，电影光影，细腻色彩层次，构图稳定，避免文字、水印、畸形结构和无关主体。",
  ].filter(Boolean).join("\n");
}

export function buildShotImagePrompt(
  shot: ShotRow,
  boundAssets: AssetRow[],
  referencedAssets: AssetRow[]
) {
  const boundCharacterAssets = boundAssets.filter((asset) => asset.type === "character");
  const boundCharacterNames = boundCharacterAssets.map((asset) => asset.name).join("、");
  const assetLines = referencedAssets.map((asset, index) => {
    const refIndex = index + 1;
    return [
      `图${refIndex}对应${assetTypeLabel(asset.type)}：${asset.name}`,
      asset.appearance ? `视觉：${asset.appearance}` : "",
      asset.description ? `设定：${asset.description}` : "",
      "生成时必须参考该图保持资产身份、结构、材质、风格和关键辨识细节一致。",
    ].filter(Boolean).join("；");
  });

  return [
    "请根据提供的参考图生成一张影视分镜画面。图1、图2等分别是当前镜头绑定的角色、场景或道具参考；画面必须保持对应资产身份、外观和统一视觉风格。",
    boundCharacterNames
      ? `当前镜头绑定角色资产：${boundCharacterNames}。画面中的说话者和发生动作的角色只能来自这些绑定角色资产。`
      : "当前镜头没有绑定角色资产。即使存在角色台词，也只能作为画外音处理，不要画出说话人物。",
    referencedAssets.length > 0 ? "资产参考说明：" : "",
    ...assetLines,
    "",
    `镜号：${shot.shotNumber}`,
    shot.sceneType ? `景别：${shot.sceneType}` : "",
    shot.shotDescription ? `分镜描述：${shot.shotDescription}` : "",
    shot.characterAction ? `角色动作：${shot.characterAction}` : "",
    shot.dialogueSpeaker ? `台词说话者：${shot.dialogueSpeaker}` : "",
    shot.dialogue
      ? `角色台词：${shot.dialogue}。台词只能归属于“台词说话者”字段中的绑定角色资产；如果台词中的说话者不在绑定角色资产中，必须按画外音处理，不要新增或替换成未绑定角色。`
      : "",
    shot.lightingMood ? `氛围光影：${shot.lightingMood}` : "",
    "要求：电影感构图，主体清晰，角色关系明确，光影统一，色彩层次细腻，不要文字、水印、畸形肢体、额外无关角色；绝对不要因为台词生成未绑定的角色。",
  ].filter(Boolean).join("\n");
}
