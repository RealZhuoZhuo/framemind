import { create } from "zustand";

export const SCENE_TYPES   = ["特写", "近景", "中景", "远景", "全景"] as const;
export const CAMERA_ANGLES = ["鸟瞰", "平视", "仰视", "俯视", "斜角"] as const;

export type SceneType   = (typeof SCENE_TYPES)[number]   | "";
export type CameraAngle = (typeof CAMERA_ANGLES)[number] | "";

export type Shot = {
  id: string;
  shotNumber: number;
  description: string;
  sceneType: SceneType;
  cameraAngle: CameraAngle;
  narration: string;
  characterId: string;
  dialogue: string;
  notes: string;
  imageGenerated: boolean;
};

type StoryboardStore = {
  shots: Shot[];
  addShot: () => void;
  removeShot: (id: string) => void;
  updateShot: (id: string, patch: Partial<Shot>) => void;
};

const defaultShots: Shot[] = [
  {
    id: "1",
    shotNumber: 1,
    description: "玻璃窗上布满晶莹的水珠。背景是城市夜景，窗外的霓虹灯光模糊闪烁，夜晚，雨夜，冷色调，人工霓虹光源。",
    sceneType: "特写",
    cameraAngle: "鸟瞰",
    narration: "雨水顺着玻璃窗蜿蜒而下，模糊了窗外闪烁的霓虹。",
    characterId: "2",
    dialogue: "复活科比比扣一",
    notes: "",
    imageGenerated: true,
  },
  {
    id: "2",
    shotNumber: 1,
    description: "玻璃窗上挂满水珠，雨滴正顺着玻璃向下流淌。背景是模糊的城市夜景，红蓝相间的霓虹灯光透过雨水晕染开来，夜晚，雨夜，冷色调。",
    sceneType: "近景",
    cameraAngle: "平视",
    narration: "雨水顺着玻璃窗蜿蜒而下，模糊了窗外闪烁的霓虹。",
    characterId: "1",
    dialogue: "暂无",
    notes: "",
    imageGenerated: false,
  },
  {
    id: "3",
    shotNumber: 2,
    description: "俯瞰视角的城市街道，密集的车辆在马路上行驶，两侧是发光的广告牌。背景是高楼林立的城市建筑群，夜晚，雨夜，冷色调。",
    sceneType: "远景",
    cameraAngle: "仰视",
    narration: "城市的夜晚从不安静，交织成一张永不熄灭的网。",
    characterId: "",
    dialogue: "暂无",
    notes: "",
    imageGenerated: false,
  },
  {
    id: "4",
    shotNumber: 2,
    description: "俯瞰视角下的城市街道。背景是城市街道，高楼林立，路面车流密集形成光轨，广告牌荧光闪耀，夜晚，雨夜，高对比度冷色调，城市人工光源。",
    sceneType: "远景",
    cameraAngle: "仰视",
    narration: "城市的夜晚从不安静，交织成一张永不熄灭的网。",
    characterId: "",
    dialogue: "暂无",
    notes: "",
    imageGenerated: true,
  },
];

export const useStoryboardStore = create<StoryboardStore>((set) => ({
  shots: defaultShots,

  addShot: () =>
    set((s) => {
      const maxNum = s.shots.reduce((m, sh) => Math.max(m, sh.shotNumber), 0);
      return {
        shots: [
          ...s.shots,
          {
            id: String(Date.now()),
            shotNumber: maxNum + 1,
            description: "",
            sceneType: "",
            cameraAngle: "",
            narration: "",
            characterId: "",
            dialogue: "",
            notes: "",
            imageGenerated: false,
          },
        ],
      };
    }),

  removeShot: (id) =>
    set((s) => ({ shots: s.shots.filter((sh) => sh.id !== id) })),

  updateShot: (id, patch) =>
    set((s) => ({
      shots: s.shots.map((sh) => (sh.id === id ? { ...sh, ...patch } : sh)),
    })),
}));
