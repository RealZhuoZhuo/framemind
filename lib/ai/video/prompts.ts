import type { ShotWithAssets } from "@/lib/db/types";

export function buildShotVideoPrompt(shot: ShotWithAssets) {
  const assetNames = shot.assets.map((asset) => asset.name).filter(Boolean).join("、");

  return [
    "请基于首帧分镜图生成一个连贯的影视镜头视频。必须保持首帧中的人物身份、场景空间、服装道具、构图关系和整体视觉风格一致。",
    "镜头运动自然、节奏稳定、电影感强，不要添加字幕、文字、水印或无关角色。",
    `镜号：${shot.shotNumber}`,
    shot.sceneType ? `景别：${shot.sceneType}` : "",
    assetNames ? `已绑定资产：${assetNames}` : "",
    shot.shotDescription ? `分镜描述：${shot.shotDescription}` : "",
    shot.characterAction ? `角色动作：${shot.characterAction}` : "",
    shot.dialogueSpeaker ? `台词说话者：${shot.dialogueSpeaker}` : "",
    shot.dialogue ? `台词内容：${shot.dialogue}` : "",
    shot.lightingMood ? `氛围光影：${shot.lightingMood}` : "",
  ].filter(Boolean).join("\n");
}
