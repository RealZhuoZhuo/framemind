import { create } from "zustand";

export type AssetType = "character" | "scene" | "prop";

export type Asset = {
  id: string;
  projectId: string;
  type: AssetType;
  name: string;
  appearance: string;
  description: string;
  mediaUrl: string | null;
  borderColor: string;
  gradientFrom: string;
};

const BORDER_COLORS = {
  character: { borderColor: "border-green-500/50", gradientFrom: "from-green-900/25" },
  scene: { borderColor: "border-sky-500/50", gradientFrom: "from-sky-900/25" },
  prop: { borderColor: "border-amber-500/50", gradientFrom: "from-amber-900/25" },
} satisfies Record<AssetType, Pick<Asset, "borderColor" | "gradientFrom">>;

function assignStyle(type: AssetType) {
  return BORDER_COLORS[type];
}

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

type AssetPayload = Omit<Asset, "borderColor" | "gradientFrom">;

function decorate(row: AssetPayload): Asset {
  return { ...row, ...assignStyle(row.type) };
}

type AssetStore = {
  projectId: string | null;
  isLoading: boolean;
  isGeneratingAllImages: boolean;
  imageGenerationProgress: { completed: number; total: number };
  assets: Asset[];
  init: (projectId: string) => Promise<void>;
  addAsset: (projectId: string, data?: Partial<Pick<Asset, "type" | "name" | "appearance" | "description" | "mediaUrl">>) => Promise<void>;
  updateAsset: (id: string, data: Partial<Pick<Asset, "type" | "name" | "appearance" | "description" | "mediaUrl">>) => Promise<void>;
  removeAsset: (id: string) => Promise<void>;
  generateAssets: (projectId: string) => Promise<void>;
  generateAssetImage: (id: string) => Promise<void>;
  generateAllAssetImages: () => Promise<void>;
};

export const useAssetStore = create<AssetStore>((set, get) => ({
  projectId: null,
  isLoading: false,
  isGeneratingAllImages: false,
  imageGenerationProgress: { completed: 0, total: 0 },
  assets: [],

  init: async (projectId) => {
    set({ projectId, isLoading: true, assets: [] });
    try {
      const res = await fetch(`/api/projects/${projectId}/assets`);
      const rows = await readJsonOrThrow<AssetPayload[]>(res);
      if (!Array.isArray(rows)) {
        throw new Error("Invalid assets payload");
      }
      set({ assets: rows.map(decorate), isLoading: false });
    } catch (e) {
      console.error("Failed to load assets:", e);
      set({ isLoading: false });
    }
  },

  addAsset: async (projectId, data) => {
    const res = await fetch(`/api/projects/${projectId}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: data?.type || "character",
        name: data?.name || "新资产",
        appearance: data?.appearance,
        description: data?.description,
        mediaUrl: data?.mediaUrl,
      }),
    });
    const row = await readJsonOrThrow<AssetPayload>(res);
    set((s) => ({ assets: [...s.assets, decorate(row)] }));
  },

  updateAsset: async (id, data) => {
    const { projectId } = get();
    if (!projectId) return;

    set((s) => ({
      assets: s.assets.map((asset) =>
        asset.id === id ? decorate({ ...asset, ...data }) : asset
      ),
    }));

    const res = await fetch(`/api/projects/${projectId}/assets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const row = await readJsonOrThrow<AssetPayload>(res);
    set((s) => ({
      assets: s.assets.map((asset) => (asset.id === id ? decorate(row) : asset)),
    }));
  },

  removeAsset: async (id) => {
    const { projectId } = get();
    if (!projectId) return;
    set((s) => ({ assets: s.assets.filter((asset) => asset.id !== id) }));
    const res = await fetch(`/api/projects/${projectId}/assets/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      console.error("Failed to delete asset:", await res.text().catch(() => ""));
    }
  },

  generateAssets: async (projectId) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/projects/${projectId}/assets/generate`, {
        method: "POST",
      });
      const rows = await readJsonOrThrow<AssetPayload[]>(res);
      set({ assets: rows.map(decorate), isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  generateAssetImage: async (id) => {
    const { projectId } = get();
    if (!projectId) return;

    const res = await fetch(`/api/projects/${projectId}/assets/${id}/image`, {
      method: "POST",
    });
    const row = await readJsonOrThrow<AssetPayload>(res);

    set((s) => ({
      assets: s.assets.map((asset) => (asset.id === id ? decorate(row) : asset)),
    }));
  },

  generateAllAssetImages: async () => {
    const { projectId, assets } = get();
    if (!projectId) return;
    if (assets.length === 0) {
      throw new Error("暂无可生成参考图的资产");
    }

    set({
      isGeneratingAllImages: true,
      imageGenerationProgress: { completed: 0, total: assets.length },
    });

    const failed: string[] = [];

    for (const [index, asset] of assets.entries()) {
      try {
        const res = await fetch(`/api/projects/${projectId}/assets/${asset.id}/image`, {
          method: "POST",
        });
        const row = await readJsonOrThrow<AssetPayload>(res);

        set((s) => ({
          assets: s.assets.map((item) => (item.id === asset.id ? decorate(row) : item)),
          imageGenerationProgress: { completed: index + 1, total: assets.length },
        }));
      } catch (error) {
        failed.push(asset.name);
        console.error(`Failed to generate asset image for ${asset.name}:`, error);
        set({ imageGenerationProgress: { completed: index + 1, total: assets.length } });
      }
    }

    set({ isGeneratingAllImages: false });

    if (failed.length > 0) {
      throw new Error(`${failed.length} 个资产图生成失败：${failed.join("、")}`);
    }
  },
}));
