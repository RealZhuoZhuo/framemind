import { create } from "zustand";
import type { SceneType } from "@/lib/storyboard/constants";
import type { AssetType } from "@/store/useAssetStore";

export { SCENE_TYPES } from "@/lib/storyboard/constants";
export type { SceneType } from "@/lib/storyboard/constants";

export type ShotAsset = {
  id: string;
  projectId: string;
  type: AssetType;
  name: string;
  appearance: string;
  description: string;
  mediaUrl: string | null;
};

export type Shot = {
  id: string;
  shotNumber: number;
  sceneType: SceneType;
  assetIds: string[];
  assets: ShotAsset[];
  dialogueSpeakerIds: string[];
  dialogueSpeakers: ShotAsset[];
  shotDescription: string;
  dialogueSpeaker: string;
  dialogue: string;
  characterAction: string;
  lightingMood: string;
  mediaUrl: string | null;
};

async function readJsonOrThrow<T>(res: Response): Promise<T> {
  const payload = await res.json();

  if (!res.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "Request failed";
    throw new Error(message);
  }

  return payload as T;
}

type StoryboardStore = {
  projectId: string | null;
  isLoading: boolean;
  isGeneratingAllImages: boolean;
  imageGenerationProgress: { completed: number; total: number };
  shots: Shot[];
  init: (projectId: string) => Promise<void>;
  updateShot: (id: string, patch: Partial<Shot>) => Promise<void>;
  generateShots: (projectId: string) => Promise<void>;
  generateShotImage: (id: string) => Promise<void>;
  generateAllShotImages: () => Promise<void>;
};

export const useStoryboardStore = create<StoryboardStore>((set, get) => ({
  projectId: null,
  isLoading: false,
  isGeneratingAllImages: false,
  imageGenerationProgress: { completed: 0, total: 0 },
  shots: [],

  init: async (projectId) => {
    set({ projectId, isLoading: true, shots: [] });
    try {
      const res = await fetch(`/api/projects/${projectId}/shots`);
      const rows = await readJsonOrThrow<Shot[]>(res);
      set({ shots: rows, isLoading: false });
    } catch (error) {
      console.error("Failed to load storyboard shots:", error);
      set({ isLoading: false });
    }
  },

  updateShot: async (id, patch) => {
    const { projectId } = get();
    if (!projectId) return;

    set((state) => ({
      shots: state.shots.map((shot) => (shot.id === id ? { ...shot, ...patch } : shot)),
    }));

    await fetch(`/api/projects/${projectId}/shots/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(console.error);
  },

  generateShots: async (projectId) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/projects/${projectId}/shots/generate`, {
        method: "POST",
      });
      const rows = await readJsonOrThrow<Shot[]>(res);
      set({ shots: rows, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  generateShotImage: async (id) => {
    const { projectId } = get();
    if (!projectId) return;

    const res = await fetch(`/api/projects/${projectId}/shots/${id}/image`, {
      method: "POST",
    });
    const row = await readJsonOrThrow<Shot>(res);

    set((state) => ({
      shots: state.shots.map((shot) => (shot.id === id ? row : shot)),
    }));
  },

  generateAllShotImages: async () => {
    const { projectId, shots } = get();
    if (!projectId) return;
    if (shots.length === 0) {
      throw new Error("暂无可生成画面的分镜");
    }

    set({
      isGeneratingAllImages: true,
      imageGenerationProgress: { completed: 0, total: shots.length },
    });

    const failed: number[] = [];

    for (const [index, shot] of shots.entries()) {
      try {
        const res = await fetch(`/api/projects/${projectId}/shots/${shot.id}/image`, {
          method: "POST",
        });
        const row = await readJsonOrThrow<Shot>(res);

        set((state) => ({
          shots: state.shots.map((item) => (item.id === shot.id ? row : item)),
          imageGenerationProgress: { completed: index + 1, total: shots.length },
        }));
      } catch (error) {
        failed.push(shot.shotNumber);
        console.error(`Failed to generate storyboard image for shot ${shot.shotNumber}:`, error);
        set({ imageGenerationProgress: { completed: index + 1, total: shots.length } });
      }
    }

    set({ isGeneratingAllImages: false });

    if (failed.length > 0) {
      throw new Error(`${failed.length} 个分镜图生成失败：${failed.join("、")}`);
    }
  },
}));
