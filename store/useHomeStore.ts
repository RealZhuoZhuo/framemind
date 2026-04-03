import { create } from "zustand";

export type Project = {
  id: string;
  title: string;
  gradient: string;
  updatedAt?: string;
};

export type Banner = {
  id: string;
  category: string;
  title: string;
  gradient: string;
};

export type NavItem = "home" | "materials" | "workspace";

type HomeStore = {
  // User info
  credits: number;
  userName: string;

  // Active nav
  activeNav: NavItem;
  setActiveNav: (nav: NavItem) => void;

  // Banner carousel
  banners: Banner[];
  activeBannerIndex: number;
  setActiveBanner: (index: number) => void;

  // Projects
  projects: Project[];
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;

  // Notifications count
  notificationCount: number;
};

export const useHomeStore = create<HomeStore>((set) => ({
  credits: 72,
  userName: "用户",

  activeNav: "home",
  setActiveNav: (nav) => set({ activeNav: nav }),

  banners: [
    {
      id: "1",
      category: "期待你，带上故事来相见",
      title: "FrameMind Arena · 36小时AI视频黑客松现已开放报名",
      gradient: "from-violet-950 via-purple-900 to-indigo-950",
    },
    {
      id: "2",
      category: "重构 · 碰撞 · 进化",
      title: "FrameMind × SXSW 2026 全球征稿计划正式开启",
      gradient: "from-zinc-900 via-zinc-800 to-neutral-900",
    },
    {
      id: "3",
      category: "艺术家 DiDi_OK 已公开创作全流程",
      title: "上线3天全网播放破1000万神作《霓虹下的失踪者》",
      gradient: "from-yellow-950 via-amber-900 to-stone-900",
    },
    {
      id: "4",
      category: "Framemind 使用说明",
      title: "三步完成你的第一支 AI 短片，从剧本到成片",
      gradient: "from-emerald-950 via-teal-900 to-slate-900",
    },
    {
      id: "5",
      category: "AI视频项目对接申请",
      title: "需求方 / 制作方项目对接申请表现已开放填报",
      gradient: "from-blue-950 via-sky-900 to-slate-900",
    },
  ],
  activeBannerIndex: 1,
  setActiveBanner: (index) => set({ activeBannerIndex: index }),

  projects: [
    {
      id: "1",
      title: "未命名",
      gradient: "from-blue-900 via-blue-800 to-slate-900",
      updatedAt: "2026/04/02",
    },
    {
      id: "2",
      title: "霓虹下的失踪者",
      gradient: "from-green-900 via-emerald-800 to-slate-900",
      updatedAt: "2026/04/02",
    },
  ],
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
  removeProject: (id) =>
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

  notificationCount: 0,
}));
