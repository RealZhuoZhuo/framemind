"use client";

import { useProjectStore, STEPS } from "@/store/useProjectStore";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import CharacterDesign   from "@/components/project/CharacterDesign";
import StoryboardTable   from "@/components/project/StoryboardTable";
import VideoProduction   from "@/components/project/VideoProduction";

const PLACEHOLDERS: Record<string, string> = {
  script:
    "请输入本集剧本内容（建议 2000 字以内），或点击右上角「导入剧本（单集）」\n提示：若为全集/多集内容，请按集拆分后分别创建作品导入",
  storyboard:
    "请上传或描述分镜图的内容，包括每个镜头的画面构成、镜头语言和情绪表达……",
  video:
    "请选择视频风格、时长和输出格式，或直接开始 AI 视频生成……",
};

export default function StepContent() {
  const { activeStep, steps, setContent, nextStep, canGoNext, sidebarCollapsed, toggleSidebar } = useProjectStore();
  const step = STEPS.find((s) => s.key === activeStep)!;

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
        <Button size="sm" onClick={nextStep} disabled={!canGoNext()} className="h-7 px-5 text-xs font-semibold">
          下一步
        </Button>
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
          <textarea
            className="h-full min-h-[400px] w-full resize-none rounded-xl border border-white/8 bg-[#111] p-5 text-sm text-white placeholder:text-white/20 focus:border-green-500/30 focus:outline-none focus:ring-0 leading-relaxed"
            placeholder={PLACEHOLDERS[activeStep]}
            value={steps[activeStep].content}
            onChange={(e) => setContent(activeStep, e.target.value)}
          />
        )}
      </div>
    </div>
  );
}
