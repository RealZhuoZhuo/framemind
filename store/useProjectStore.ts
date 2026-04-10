import { create } from "zustand";

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
  activeStep: StepKey;
  steps: Record<StepKey, StepState>;
  sidebarCollapsed: boolean;

  init: (projectId: string) => Promise<void>;
  setActiveStep: (step: StepKey) => void;
  setContent: (step: StepKey, content: string) => void;
  markCompleted: (step: StepKey) => void;
  nextStep: () => void;
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

function saveStep(projectId: string, stepKey: StepKey, data: { content?: string; completed?: boolean }) {
  fetch(`/api/projects/${projectId}/steps/${stepKey}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).catch(console.error);
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projectId: null,
  isLoading: false,
  activeStep: "script",
  steps: { ...initial },
  sidebarCollapsed: false,

  init: async (projectId) => {
    set({ projectId, isLoading: true, steps: { ...initial }, activeStep: "script" });
    try {
      const res = await fetch(`/api/projects/${projectId}/steps`);
      const rows: { stepKey: StepKey; completed: boolean; content: string }[] = await res.json();

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
    }, 1000);
  },

  markCompleted: (step) =>
    set((s) => ({
      steps: { ...s.steps, [step]: { ...s.steps[step], completed: true } },
    })),

  nextStep: () => {
    const { activeStep, steps, projectId } = get();
    const idx = STEPS.findIndex((s) => s.key === activeStep);
    if (idx < STEPS.length - 1) {
      const next = STEPS[idx + 1].key;
      set((s) => ({
        activeStep: next,
        steps: {
          ...s.steps,
          [activeStep]: { ...s.steps[activeStep], completed: true },
        },
      }));
      if (projectId) {
        saveStep(projectId, activeStep, {
          completed: true,
          content: steps[activeStep].content,
        });
      }
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
