import { create } from "zustand";

export type VideoClip = {
  id: string;
  start: number;
  end: number;
  mediaUrl: string;
  label: string;
};

export type SubtitleClip = {
  id: string;
  start: number;
  end: number;
  text: string;
};

export type AudioClip = {
  id: string;
  start: number;
  end: number;
  label: string;
};

type VideoStore = {
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  showSubtitles: boolean;
  videoClips: VideoClip[];
  subtitleClips: SubtitleClip[];
  audioClips: AudioClip[];

  setCurrentTime: (t: number) => void;
  setPlaying: (p: boolean) => void;
  toggleSubtitles: () => void;
  updateVideoClip: (id: string, patch: Partial<VideoClip>) => void;
  addVideoClip: (clip: VideoClip) => void;
  addSubtitleClip: (clip: SubtitleClip) => void;
  addAudioClip: (clip: AudioClip) => void;
};

const DURATION = 30; // 5 clips × 5 s + 5 s tail room

// 5 scene images — Unsplash (stable photo IDs, no auth required)
const defaultVideoClips: VideoClip[] = [
  {
    id: "v1", start: 0,  end: 5,
    mediaUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80",
    label: "镜头 1",
  },
  {
    id: "v2", start: 5,  end: 10,
    mediaUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
    label: "镜头 2",
  },
  {
    id: "v3", start: 10, end: 15,
    mediaUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    label: "镜头 3",
  },
  {
    id: "v4", start: 15, end: 20,
    mediaUrl: "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&q=80",
    label: "镜头 4",
  },
  {
    id: "v5", start: 20, end: 25,
    mediaUrl: "https://images.unsplash.com/photo-1529927066849-79b791a69825?w=800&q=80",
    label: "镜头 5",
  },
];

const defaultSubtitleClips: SubtitleClip[] = [
  { id: "s1", start: 0,  end: 5,  text: "雨水顺着玻璃窗蜿蜒而下，模糊了窗外闪烁的霓虹。" },
  { id: "s2", start: 5,  end: 10, text: "城市的夜晚从不安静，交织成一张永不熄灭的网。" },
  { id: "s3", start: 10, end: 15, text: "林默坐在办公桌前，指间夹着一支快要燃尽的烟。" },
  { id: "s4", start: 15, end: 20, text: "烟灰缸里堆满了烟蒂，显示出主人已久坐于此。" },
  { id: "s5", start: 20, end: 25, text: "她三十岁左右，衣着考究，妆容精致。" },
];

const defaultAudioClips: AudioClip[] = [
  { id: "a1", start: 0,  end: 5,  label: "旁白" },
  { id: "a2", start: 5,  end: 10, label: "旁白" },
  { id: "a3", start: 10, end: 15, label: "旁白" },
  { id: "a4", start: 15, end: 20, label: "旁白" },
  { id: "a5", start: 20, end: 25, label: "旁白" },
];

export const useVideoStore = create<VideoStore>((set) => ({
  duration: DURATION,
  currentTime: 0,
  isPlaying: false,
  showSubtitles: true,
  videoClips: defaultVideoClips,
  subtitleClips: defaultSubtitleClips,
  audioClips: defaultAudioClips,

  setCurrentTime: (t) =>
    set({ currentTime: Math.max(0, Math.min(t, DURATION)) }),

  addVideoClip: (clip) =>
    set((s) => ({ videoClips: [...s.videoClips, clip] })),
  addSubtitleClip: (clip) =>
    set((s) => ({ subtitleClips: [...s.subtitleClips, clip] })),
  addAudioClip: (clip) =>
    set((s) => ({ audioClips: [...s.audioClips, clip] })),

  setPlaying: (p) => set({ isPlaying: p }),

  toggleSubtitles: () => set((s) => ({ showSubtitles: !s.showSubtitles })),

  updateVideoClip: (id, patch) =>
    set((s) => ({
      videoClips: s.videoClips.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
}));
