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
  shots: Shot[];
  init: (projectId: string) => Promise<void>;
  updateShot: (id: string, patch: Partial<Shot>) => Promise<void>;
  generateShots: (projectId: string) => Promise<void>;
  generateShotImage: (id: string) => Promise<void>;
};

export const useStoryboardStore = create<StoryboardStore>((set, get) => ({
  projectId: null,
  isLoading: false,
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
}));
