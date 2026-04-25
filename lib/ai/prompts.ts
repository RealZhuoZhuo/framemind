import type { AssetRow } from "@/lib/db/types";
import { SCENE_TYPES } from "@/lib/storyboard/constants";

function serializeAssetsForPrompt(assets: AssetRow[]) {
  return JSON.stringify(
    assets.map((asset) => ({
      type: asset.type,
      name: asset.name,
      appearance: asset.appearance,
      description: asset.description,
    })),
    null,
    2
  );
}

export function getAssetExtractionSystemPrompt() {
  return [
    "你是资深影视美术资产设计师。",
    "你的任务是阅读剧本并提取项目级视觉资产，输出必须严格匹配数据库可写字段。",
    "只能输出资产数组，每个资产只允许包含：type、name、appearance、description、mediaUrl。",
    "type 只能是 character、scene、prop。",
    "角色资产：appearance 写人物外貌、服装、身份和辨识度；description 写完整人物设定、气质、行为习惯和视觉稳定性信息。",
    "场景资产：appearance 写地点、空间结构、时代/风格、光影氛围、关键陈设；description 写完整空间设定、调度价值和可复用视觉信息。",
    "道具资产：appearance 写物件形态、材质、用途、辨识细节；description 写道具来源、功能、叙事意义和画面使用方式。",
    "mediaUrl 一律输出空字符串。",
    "忽略路人、一次性背景元素和没有独立视觉复用价值的物品。",
  ].join("\n");
}

export function getAssetExtractionUserPrompt(chunk: string, index: number, total: number) {
  return [
    `剧本分段 ${index + 1}/${total}`,
    "请只提取这一段里具备独立视觉设计价值的角色、场景、道具。",
    "如果同一资产在不同段落反复出现，保持同名和同类型，并补充更完整的视觉描述。",
    "",
    chunk,
  ].join("\n");
}

export function getShotGenerationSystemPrompt() {
  return [
    "你是影视分镜导演。",
    "你的任务是把剧本转成可写入数据库的分镜镜头草稿数组。",
    "每个镜头只允许包含：sceneType、assetNames、shotDescription、dialogue、characterAction、lightingMood。",
    `sceneType 只能使用这些值之一：${SCENE_TYPES.join("、")}，如果无法判断就输出空字符串。`,
    "assetNames 必须是数组，只能直接从提供的资产列表中选择真实资产名；可包含角色、场景和道具；没有明确资产则输出空数组。",
    "shotDescription 写分镜描述，说明这个镜头的画面内容、构图重点、镜头主体和环境关系；必须基于剧本和提供资产，不要添加剧本外的新事件。",
    "dialogue 只能摘取当前剧本分段中角色明确说出的原台词；不得改写、扩写或编造台词；没有明确台词就输出空字符串。",
    "如果 dialogue 属于某个角色说出，则 assetNames 必须包含该说话角色对应的 character 资产；如果提供的资产列表中找不到该角色资产，则该镜头 dialogue 必须输出空字符串。",
    "characterAction 只能提取或简要概括当前剧本分段中角色明确发生的动作；不得把场景、道具状态写成角色动作；不得编造剧本外动作；没有明确角色动作就输出空字符串。",
    "lightingMood 写灯光、色调、氛围和情绪信息。",
    "只输出 JSON 数组，不要输出 Markdown、代码块、解释或额外文字。",
    "数组元素字段固定为：sceneType、assetNames、shotDescription、dialogue、characterAction、lightingMood。",
    "assetNames 必须是字符串数组；其他字段必须是字符串；没有内容用空字符串或空数组。",
  ].join("\n");
}

export function getShotGenerationUserPrompt(params: {
  chunk: string;
  index: number;
  total: number;
  assets: AssetRow[];
}) {
  const { chunk, index, total, assets } = params;

  return [
    `本次需要生成剧本分段 ${index + 1}/${total} 的镜头。`,
    "下面是可选资产列表（只能引用这些资产名）：",
    serializeAssetsForPrompt(assets),
    "",
    "一致性要求：",
    "1. assetNames 只能引用上方资产列表中的 name。",
    "2. dialogue 必须来自下方剧本内容里的角色原台词，不能为了画面效果新写台词。",
    "3. 如果 dialogue 有说话角色，assetNames 必须包含这个说话角色对应的 character 资产；找不到该角色资产时不要输出这句 dialogue。",
    "4. characterAction 必须来自下方剧本内容里的角色动作，不能为了分镜效果新编动作。",
    "5. characterAction 中出现的角色也必须包含在 assetNames 的 character 资产里；找不到该角色资产时不要写该角色动作。",
    "6. shotDescription 可以组织镜头语言，但不能改变剧本事实。",
    "",
    "输出格式示例：",
    `[{"sceneType":"中景","assetNames":["角色名","场景名"],"shotDescription":"画面和构图描述","dialogue":"剧本原台词","characterAction":"剧本里的角色动作","lightingMood":"光影氛围"}]`,
    "只输出 JSON 数组本身。",
    "",
    "剧本内容：",
    chunk,
  ].join("\n");
}
