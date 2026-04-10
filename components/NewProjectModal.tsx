"use client";

import { useState, useRef, useEffect } from "react";
import { X, Wand2, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Mode = "auto" | "canvas";
type VideoMode = "drama" | "narration" | "talking-head";
type AspectRatio = "16:9" | "9:16" | "1:1";
type VisualStyle = "realistic" | "3d-animation" | "japanese-anime";

export type ProjectSettings = {
  name: string;
  videoMode: VideoMode;
  aspectRatio: AspectRatio;
  visualStyle: VisualStyle;
};

const VIDEO_MODES: { value: VideoMode; label: string; desc: string }[] = [
  { value: "drama",        label: "剧情演绎", desc: "按原文提炼重点情节生成分镜，含旁白与角色对白" },
  { value: "narration",    label: "旁白解说", desc: "原文逐句拆分镜，旁白叙事为主，含角色对话" },
  { value: "talking-head", label: "口播讲解", desc: "原文逐句拆镜，以旁白形式呈现" },
];

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "1:1",  label: "1:1" },
];

const VISUAL_STYLES: { value: VisualStyle; label: string }[] = [
  { value: "realistic",      label: "通用写实" },
  { value: "3d-animation",   label: "3D动漫" },
  { value: "japanese-anime", label: "日漫风格" },
];

export default function NewProjectModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (settings: ProjectSettings) => Promise<void>;
}) {
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);
  const [name, setName] = useState("");
  const [videoMode, setVideoMode] = useState<VideoMode | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio | null>(null);
  const [visualStyle, setVisualStyle] = useState<VisualStyle | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedMode === "auto") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [selectedMode]);

  const canConfirm = selectedMode === "auto" && videoMode && aspectRatio && visualStyle;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    try {
      await onCreate({
        name: name.trim() || "未命名",
        videoMode,
        aspectRatio,
        visualStyle,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#161616] p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-base font-semibold text-white">新建项目</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 hover:bg-white/8 hover:text-white/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode selection */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Auto mode */}
          <button
            onClick={() => setSelectedMode("auto")}
            className={cn(
              "flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-all duration-150",
              selectedMode === "auto"
                ? "border-green-500/50 bg-green-500/8"
                : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5"
            )}
          >
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              selectedMode === "auto" ? "bg-green-500/20" : "bg-white/8"
            )}>
              <Wand2 className={cn("h-4 w-4", selectedMode === "auto" ? "text-green-400" : "text-white/40")} />
            </div>
            <div>
              <p className={cn("text-sm font-semibold", selectedMode === "auto" ? "text-white" : "text-white/70")}>
                自动模式
              </p>
              <p className="mt-1 text-xs text-white/35 leading-relaxed">
                AI 引导逐步完成<br />剧本、角色、分镜
              </p>
            </div>
            <div className={cn(
              "mt-auto h-1.5 w-1.5 rounded-full transition-colors",
              selectedMode === "auto" ? "bg-green-400" : "bg-transparent"
            )} />
          </button>

          {/* Canvas mode — disabled */}
          <div className="flex flex-col items-start gap-3 rounded-xl border border-white/5 bg-white/2 p-5 opacity-40 cursor-not-allowed select-none">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/8">
              <LayoutTemplate className="h-4 w-4 text-white/40" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white/70">画布模式</p>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/40">即将上线</span>
              </div>
              <p className="mt-1 text-xs text-white/35 leading-relaxed">
                自由拖拽编排节点<br />灵活组织创作流程
              </p>
            </div>
          </div>
        </div>

        {/* Auto mode settings */}
        {selectedMode === "auto" && (
          <div className="space-y-5 mb-6">
            {/* Project name */}
            <div>
              <label className="mb-2 block text-xs text-white/40">项目名称</label>
              <input
                ref={inputRef}
                type="text"
                placeholder="未命名"
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && canConfirm) handleConfirm(); }}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-green-500/40 focus:outline-none transition-colors"
              />
            </div>

            {/* Video creation mode */}
            <div>
              <label className="mb-2 block text-xs text-white/40">视频创作模式</label>
              <div className="space-y-2">
                {VIDEO_MODES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setVideoMode(m.value)}
                    className={cn(
                      "w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150",
                      videoMode === m.value
                        ? "border-green-500/50 bg-green-500/8"
                        : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 transition-colors",
                      videoMode === m.value ? "border-green-400 bg-green-400" : "border-white/20 bg-transparent"
                    )} />
                    <div>
                      <p className={cn("text-sm font-medium leading-tight", videoMode === m.value ? "text-white" : "text-white/60")}>
                        {m.label}
                      </p>
                      <p className="mt-0.5 text-xs text-white/30 leading-relaxed">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect ratio */}
            <div>
              <label className="mb-2 block text-xs text-white/40">画幅比例</label>
              <div className="flex gap-2">
                {ASPECT_RATIOS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setAspectRatio(r.value)}
                    className={cn(
                      "flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all duration-150",
                      aspectRatio === r.value
                        ? "border-green-500/50 bg-green-500/8 text-white"
                        : "border-white/8 bg-white/3 text-white/50 hover:border-white/15 hover:bg-white/5 hover:text-white/70"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual style */}
            <div>
              <label className="mb-2 block text-xs text-white/40">画面风格</label>
              <div className="flex gap-2">
                {VISUAL_STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setVisualStyle(s.value)}
                    className={cn(
                      "flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all duration-150",
                      visualStyle === s.value
                        ? "border-green-500/50 bg-green-500/8 text-white"
                        : "border-white/8 bg-white/3 text-white/50 hover:border-white/15 hover:bg-white/5 hover:text-white/70"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-9 rounded-lg px-5 text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            取消
          </button>
          <Button
            size="sm"
            disabled={!canConfirm || loading}
            onClick={handleConfirm}
            className="h-9 px-6 text-sm"
          >
            {loading ? "创建中…" : "开始创作"}
          </Button>
        </div>
      </div>
    </div>
  );
}
