export const SCENE_TYPES = ["特写", "近景", "中景", "远景", "全景"] as const;

export type SceneType = (typeof SCENE_TYPES)[number] | "";
