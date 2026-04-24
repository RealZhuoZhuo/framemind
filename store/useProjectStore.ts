import { create } from "zustand";
import { useCharacterStore } from "./useCharacterStore";
import { useStoryboardStore } from "./useStoryboardStore";

export type StepKey = "script" | "character" | "storyboard" | "video";

export const STEPS: { key: StepKey; label: string; index: number }[] = [
  { key: "script",      label: "故事剧本", index: 1 },
  { key: "character",   label: "角色设计", index: 2 },
  { key: "storyboard",  label: "分镜图",   index: 3 },
  { key: "video",       label: "视频制作", index: 4 },
];

type StepState = {
  completed: boolean;
  content: string;
};

type ProjectStore = {
  projectId: string | null;
  isLoading: boolean;
  isTransitioning: boolean;
  activeStep: StepKey;
  steps: Record<StepKey, StepState>;
  sidebarCollapsed: boolean;
  transitionError: string;

  init: (projectId: string) => Promise<void>;
  setActiveStep: (step: StepKey) => void;
  setContent: (step: StepKey, content: string) => void;
  markCompleted: (step: StepKey) => void;
  nextStep: () => Promise<void>;
  canGoNext: () => boolean;
  canAccess: (step: StepKey) => boolean;
  toggleSidebar: () => void;
};

const initial: Record<StepKey, StepState> = {
  script:     { completed: false, content: "" },
  character:  { completed: false, content: "" },
  storyboard: { completed: false, content: "" },
  video:      { completed: false, content: "" },
};

// Per-step debounce timers for content auto-save
const _contentTimers: Partial<Record<StepKey, ReturnType<typeof setTimeout>>> = {};

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

function saveStep(projectId: string, stepKey: StepKey, data: { content?: string; completed?: boolean }) {
  fetch(`/api/projects/${projectId}/steps/${stepKey}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).catch(console.error);
}

function saveProject(projectId: string, data: { script?: string }) {
  fetch(`/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).catch(console.error);
}

async function saveStepOrThrow(projectId: string, stepKey: StepKey, data: { content?: string; completed?: boolean }) {
  const res = await fetch(`/api/projects/${projectId}/steps/${stepKey}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await readJsonOrThrow(res);
}

async function saveProjectOrThrow(projectId: string, data: { script?: string }) {
  const res = await fetch(`/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await readJsonOrThrow(res);
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projectId: null,
  isLoading: false,
  isTransitioning: false,
  activeStep: "script",
  steps: { ...initial },
  sidebarCollapsed: false,
  transitionError: "",

  init: async (projectId) => {
    set({ projectId, isLoading: true, isTransitioning: false, transitionError: "", steps: { ...initial }, activeStep: "script" });
    try {
      const res = await fetch(`/api/projects/${projectId}/steps`);
      const rows = await readJsonOrThrow<{ stepKey: StepKey; completed: boolean; content: string }[]>(res);
      if (!Array.isArray(rows)) {
        throw new Error("Invalid steps payload");
      }

      const steps: Record<StepKey, StepState> = { ...initial };
      for (const row of rows) {
        steps[row.stepKey] = { completed: row.completed, content: row.content };
      }

      // Land on the first incomplete step
      const firstIncomplete = STEPS.find((s) => !steps[s.key].completed);
      set({ steps, isLoading: false, activeStep: firstIncomplete?.key ?? "video" });
    } catch (e) {
      console.error("Failed to load steps:", e);
      set({ isLoading: false });
    }
  },

  setActiveStep: (step) => {
    if (get().isTransitioning) return;
    if (!get().canAccess(step)) return;
    set({ activeStep: step });
  },

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  setContent: (step, content) => {
    set((s) => ({
      steps: { ...s.steps, [step]: { ...s.steps[step], content } },
    }));
    const { projectId } = get();
    if (!projectId) return;
    if (_contentTimers[step]) clearTimeout(_contentTimers[step]);
    _contentTimers[step] = setTimeout(() => {
      saveStep(projectId, step, { content });
      if (step === "script") {
        saveProject(projectId, { script: content });
      }
    }, 1000);
  },

  markCompleted: (step) =>
    set((s) => ({
      steps: { ...s.steps, [step]: { ...s.steps[step], completed: true } },
    })),

  nextStep: async () => {
    const { activeStep, steps, projectId } = get();
    if (!projectId || get().isTransitioning) return;
    const idx = STEPS.findIndex((s) => s.key === activeStep);
    if (idx >= STEPS.length - 1) return;

    const next = STEPS[idx + 1].key;
    set({ isTransitioning: true, transitionError: "" });

    try {
      await saveStepOrThrow(projectId, activeStep, {
        completed: true,
        content: steps[activeStep].content,
      });

      if (activeStep === "script") {
        await saveProjectOrThrow(projectId, { script: steps.script.content });
        await useCharacterStore.getState().generateCharacters(projectId);
      } else if (activeStep === "character") {
        await useStoryboardStore.getState().generateShots(projectId);
      }

      set((s) => ({
        isTransitioning: false,
        activeStep: next,
        steps: {
          ...s.steps,
          [activeStep]: { ...s.steps[activeStep], completed: true },
        },
      }));
    } catch (error) {
      set({
        isTransitioning: false,
        transitionError: error instanceof Error ? error.message : "处理失败",
      });
    }
  },

  canGoNext: () => {
    const { activeStep } = get();
    return STEPS.findIndex((s) => s.key === activeStep) < STEPS.length - 1;
  },

  canAccess: (step) => {
    const { steps } = get();
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx === 0) return true;
    return STEPS.slice(0, idx).every((s) => steps[s.key].completed);
  },
}));
