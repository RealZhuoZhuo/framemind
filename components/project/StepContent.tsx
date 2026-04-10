"use client";

import { useState, useRef } from "react";
import { useProjectStore, STEPS } from "@/store/useProjectStore";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen, Upload, FileText, X } from "lucide-react";
import CharacterDesign   from "@/components/project/CharacterDesign";
import StoryboardTable   from "@/components/project/StoryboardTable";
import VideoProduction   from "@/components/project/VideoProduction";
import mammoth from "mammoth";

const PLACEHOLDERS: Record<string, string> = {
  script:
    "请输入本集剧本内容（建议 20000 字以内），或点击左上角「上传剧本」\n提示：若为全集/多集内容，请按集拆分后分别创建作品导入",
  storyboard:
    "请上传或描述分镜图的内容，包括每个镜头的画面构成、镜头语言和情绪表达……",
  video:
    "请选择视频风格、时长和输出格式，或直接开始 AI 视频生成……",
};

function UploadModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (text: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = (f: File) => {
    const ok = /\.(doc|docx)$/i.test(f.name);
    if (!ok) setError("仅支持 .doc / .docx 格式");
    else setError("");
    return ok;
  };

  const handleFile = (f: File) => {
    if (validate(f)) setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleConfirm = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      onImport(result.value);
      onClose();
    } catch {
      setError("解析失败，请确认文件格式正确");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative w-[780px] rounded-2xl border border-white/10 bg-[#161616] p-10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-white">上传剧本</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 hover:bg-white/8 hover:text-white/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed py-16 transition-colors ${
            dragging
              ? "border-green-500/60 bg-green-500/5"
              : "border-white/10 bg-white/3 hover:border-white/20"
          }`}
        >
          {file ? (
            <>
              <FileText className="h-14 w-14 text-green-400" />
              <span className="text-sm text-white/70">{file.name}</span>
              <span className="text-xs text-white/30">点击重新选择</span>
            </>
          ) : (
            <>
              <Upload className="h-14 w-14 text-white/20" />
              <span className="text-sm text-white/50">点击或拖拽文件到此处</span>
              <span className="text-xs text-white/25">仅支持 .doc / .docx</span>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".doc,.docx"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-9 rounded-lg px-5 text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            取消
          </button>
          <Button
            size="sm"
            disabled={!file || loading}
            onClick={handleConfirm}
            className="h-9 px-6 text-sm"
          >
            {loading ? "解析中…" : "导入"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function StepContent() {
  const { activeStep, steps, setContent, nextStep, canGoNext, sidebarCollapsed, toggleSidebar } = useProjectStore();
  const step = STEPS.find((s) => s.key === activeStep)!;
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Title row */}
      <div className="flex items-center justify-between px-8 pt-8 pb-4">
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleSidebar}
            className="flex h-6 w-6 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-white/8 hover:text-white/60"
            title={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 text-xs font-bold text-green-400">
            {step.index}
          </span>
          <h1 className="text-base font-semibold text-white">{step.label}</h1>
        </div>
        <div className="flex items-center gap-2">
          {activeStep === "script" && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/50 hover:border-white/20 hover:bg-white/8 hover:text-white/70 transition-all"
            >
              <Upload className="h-3 w-3" />
              上传剧本
            </button>
          )}
          <Button size="sm" onClick={nextStep} disabled={!canGoNext()} className="h-7 px-5 text-xs font-semibold">
            下一步
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        {activeStep === "character"  ? (
          <CharacterDesign />
        ) : activeStep === "storyboard" ? (
          <StoryboardTable />
        ) : activeStep === "video" ? (
          <VideoProduction />
        ) : (
          <div className="relative h-full min-h-[400px]">
            <textarea
              className="h-full w-full resize-none rounded-xl border border-white/8 bg-[#111] p-5 text-sm text-white placeholder:text-white/20 focus:border-green-500/30 focus:outline-none focus:ring-0 leading-relaxed"
              placeholder={PLACEHOLDERS[activeStep]}
              value={steps[activeStep].content}
              onChange={(e) => setContent(activeStep, e.target.value)}
            />
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onImport={(text) => setContent("script", text)}
        />
      )}
    </div>
  );
}
