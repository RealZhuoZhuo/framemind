import type { CharacterRow } from "@/lib/db/types";
import { SCENE_TYPES } from "@/lib/storyboard/constants";

function serializeCharactersForPrompt(characters: CharacterRow[]) {
  return JSON.stringify(
    characters.map((character) => ({
      id: character.id,
      name: character.name,
      appearance: character.appearance,
      description: character.description,
    })),
    null,
    2
  );
}

export function getCharacterExtractionSystemPrompt() {
  return [
    "你是资深影视角色设计师。",
    "你的任务是阅读剧本并提取主要角色，输出必须严格匹配数据库可写字段。",
    "只能输出角色数组，每个角色只允许包含：name、appearance、description、mediaUrl。",
    "appearance 只写可视化外形识别要点，例如年龄感、体型、发型、五官特征、服装风格、标志性配件。",
    "description 写更完整的角色描述，用于后续生成稳定视觉设定，可以包含性格、身份、服装细节、行为习惯和辨识度信息。",
    "mediaUrl 一律输出空字符串。",
    "忽略路人、一次性背景人物和没有独立视觉价值的无名角色。",
  ].join("\n");
}

export function getCharacterExtractionUserPrompt(chunk: string, index: number, total: number) {
  return [
    `剧本分段 ${index + 1}/${total}`,
    "请只提取这一段里具备独立视觉设计价值的主要角色。",
    "如果同一角色在不同段落反复出现，保持同名，并补充更完整的视觉描述。",
    "",
    chunk,
  ].join("\n");
}

export function getShotGenerationSystemPrompt() {
  return [
    "你是影视分镜导演。",
    "你的任务是把剧本转成数据库可写的分镜镜头数组。",
    "每个镜头只允许包含：shotNumber、sceneType、characterId、dialogue、characterAction、lightingMood、mediaUrl。",
    `sceneType 只能使用这些值之一：${SCENE_TYPES.join("、")}，如果无法判断就输出空字符串。`,
    "characterId 必须直接从提供的角色列表中选择一个真实 id；如果该镜头没有明确主角色，则输出 null。",
    "dialogue 只写当前镜头里最核心的台词内容，没有则输出空字符串。",
    "characterAction 要承担画面描述职责，写清楚人物动作、环境构成、构图重点和镜头主体。",
    "lightingMood 写灯光、色调、氛围和情绪信息。",
    "mediaUrl 一律输出空字符串。",
    "不要输出额外字段，不要解释。",
  ].join("\n");
}

export function getShotGenerationUserPrompt(params: {
  chunk: string;
  index: number;
  total: number;
  startShotNumber: number;
  characters: CharacterRow[];
}) {
  const { chunk, index, total, startShotNumber, characters } = params;

  return [
    `本次需要生成剧本分段 ${index + 1}/${total} 的镜头。`,
    `镜头序号从 ${startShotNumber} 开始递增。`,
    "下面是可选角色列表（只能引用这些角色 id）：",
    serializeCharactersForPrompt(characters),
    "",
    "剧本内容：",
    chunk,
  ].join("\n");
}
