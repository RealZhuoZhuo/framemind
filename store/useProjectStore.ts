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
  activeStep: StepKey;
  steps: Record<StepKey, StepState>;
  sidebarCollapsed: boolean;

  setActiveStep: (step: StepKey) => void;
  setContent: (step: StepKey, content: string) => void;
  markCompleted: (step: StepKey) => void;
  nextStep: () => void;
  canGoNext: () => boolean;
  toggleSidebar: () => void;
};

const initial: Record<StepKey, StepState> = {
  script:     { completed: false, content: "" },
  character:  { completed: false, content: "" },
  storyboard: { completed: false, content: "" },
  video:      { completed: false, content: "" },
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  activeStep: "script",
  steps: initial,
  sidebarCollapsed: false,

  setActiveStep: (step) => set({ activeStep: step }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  setContent: (step, content) =>
    set((s) => ({
      steps: { ...s.steps, [step]: { ...s.steps[step], content } },
    })),

  markCompleted: (step) =>
    set((s) => ({
      steps: { ...s.steps, [step]: { ...s.steps[step], completed: true } },
    })),

  nextStep: () => {
    const { activeStep } = get();
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
    }
  },

  canGoNext: () => {
    const { activeStep } = get();
    return STEPS.findIndex((s) => s.key === activeStep) < STEPS.length - 1;
  },
}));

