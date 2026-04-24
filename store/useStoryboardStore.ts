import { create } from "zustand";

export const SCENE_TYPES = ["特写", "近景", "中景", "远景", "全景"] as const;

export type SceneType = (typeof SCENE_TYPES)[number] | "";

export type Shot = {
  id: string;
  shotNumber: number;
  sceneType: SceneType;
  characterId: string;
  dialogue: string;
  characterAction: string;
  lightingMood: string;
  mediaUrl: string;
};

type StoryboardStore = {
  shots: Shot[];
  updateShot: (id: string, patch: Partial<Shot>) => void;
};

const defaultShots: Shot[] = [
  {
    id: "1",
    shotNumber: 1,
    sceneType: "特写",
    characterId: "2",
    dialogue: "先别开口，让我想清楚。",
    characterAction: "手指悬停在键盘上，短暂停顿后按下回车，肩膀紧绷。",
    lightingMood: "冷蓝屏幕光打在脸上，环境压暗，轻微霓虹反光。",
    mediaUrl: "demo-shot-1",
  },
  {
    id: "2",
    shotNumber: 2,
    sceneType: "中景",
    characterId: "1",
    dialogue: "现在没有退路了。",
    characterAction: "人物从椅子上猛地起身，转头看向门口，呼吸急促。",
    lightingMood: "顶光偏硬，背景留有暗部，空气里有压迫感。",
    mediaUrl: "",
  },
];

export const useStoryboardStore = create<StoryboardStore>((set) => ({
  shots: defaultShots,

  updateShot: (id, patch) =>
    set((s) => ({
      shots: s.shots.map((sh) => (sh.id === id ? { ...sh, ...patch } : sh)),
    })),
}));
