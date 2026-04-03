"use client";

import { RotateCcw, RotateCw, Copy, Trash2, Upload, History, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/useProjectStore";
import { useRouter } from "next/navigation";

export default function ProjectTopBar() {
  const { nextStep, canGoNext, activeStep } = useProjectStore();
  const router = useRouter();

  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/8 bg-[#0d0d0d] px-4">
      {/* Left: back + edit actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="h-7 gap-1.5 px-2 text-xs text-white/40 hover:text-white/70"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回
        </Button>

        <div className="mx-1.5 h-4 w-px bg-white/10" />

        {[
          { icon: <RotateCcw className="h-3.5 w-3.5" />, label: "撤销" },
          { icon: <RotateCw  className="h-3.5 w-3.5" />, label: "重做" },
          { icon: <Copy      className="h-3.5 w-3.5" />, label: "复制" },
          { icon: <Trash2    className="h-3.5 w-3.5" />, label: "清空" },
        ].map(({ icon, label }) => (
          <Button
            key={label}
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-xs text-white/50 hover:text-white/80"
          >
            {icon}
            {label}
          </Button>
        ))}
      </div>

      {/* Right: import + history + next */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 px-3 text-xs"
        >
          <Upload className="h-3.5 w-3.5" />
          导入剧本（单集）
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 px-3 text-xs"
        >
          <History className="h-3.5 w-3.5" />
          历史版本
        </Button>

        <Button
          size="sm"
          onClick={nextStep}
          disabled={!canGoNext()}
          className="h-7 px-4 text-xs font-semibold"
        >
          下一步
        </Button>
      </div>
    </div>
  );
}
