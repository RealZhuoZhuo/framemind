import { create } from "zustand";

export type Character = {
  id: string;
  name: string;
  appearance: string;
  description: string;
  mediaUrl: string | null;
  // UI-only, assigned by index on load
  borderColor: string;
  gradientFrom: string;
};

const BORDER_COLORS = [
  { borderColor: "border-green-500/50", gradientFrom: "from-green-900/25" },
];

function assignStyle(idx: number) {
  return BORDER_COLORS[idx % BORDER_COLORS.length];
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

type CharacterStore = {
  projectId: string | null;
  isLoading: boolean;
  characters: Character[];
  init: (projectId: string) => Promise<void>;
  addCharacter: (projectId: string, data?: { name?: string; appearance?: string; description?: string; mediaUrl?: string | null }) => Promise<void>;
  updateCharacter: (id: string, data: Partial<Pick<Character, "name" | "appearance" | "description" | "mediaUrl">>) => Promise<void>;
  removeCharacter: (id: string) => Promise<void>;
  generateCharacters: (projectId: string) => Promise<void>;
};

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  projectId: null,
  isLoading: false,
  characters: [],

  init: async (projectId) => {
    set({ projectId, isLoading: true, characters: [] });
    try {
      const res = await fetch(`/api/projects/${projectId}/characters`);
      const rows = await readJsonOrThrow<{ id: string; name: string; appearance: string; description: string; mediaUrl: string | null }[]>(res);
      if (!Array.isArray(rows)) {
        throw new Error("Invalid characters payload");
      }
      const characters: Character[] = rows.map((r, i) => ({ ...r, ...assignStyle(i) }));
      set({ characters, isLoading: false });
    } catch (e) {
      console.error("Failed to load characters:", e);
      set({ isLoading: false });
    }
  },

  addCharacter: async (projectId, data) => {
    const res = await fetch(`/api/projects/${projectId}/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data?.name || "新角色", appearance: data?.appearance, description: data?.description, mediaUrl: data?.mediaUrl }),
    });
    const row = await readJsonOrThrow<{ id: string; name: string; appearance: string; description: string; mediaUrl: string | null }>(res);
    set((s) => ({
      characters: [...s.characters, { ...row, ...assignStyle(s.characters.length) }],
    }));
  },

  updateCharacter: async (id, data) => {
    const { projectId } = get();
    if (!projectId) return;
    // Optimistic update
    set((s) => ({
      characters: s.characters.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
    await fetch(`/api/projects/${projectId}/characters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(console.error);
  },

  removeCharacter: async (id) => {
    const { projectId } = get();
    if (!projectId) return;
    set((s) => ({
      characters: s.characters.filter((c) => c.id !== id).map((c, i) => ({ ...c, ...assignStyle(i) })),
    }));
    await fetch(`/api/projects/${projectId}/characters/${id}`, {
      method: "DELETE",
    }).catch(console.error);
  },

  generateCharacters: async (projectId) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/projects/${projectId}/characters/generate`, {
        method: "POST",
      });
      const rows = await readJsonOrThrow<{ id: string; name: string; appearance: string; description: string; mediaUrl: string | null }[]>(res);
      const characters: Character[] = rows.map((row, index) => ({ ...row, ...assignStyle(index) }));
      set({ characters, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
