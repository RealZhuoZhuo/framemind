"use client";

import { Check, ArrowLeft, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { STEPS, useProjectStore } from "@/store/useProjectStore";

export default function ProjectSidebar() {
  const { activeStep, steps, setActiveStep, sidebarCollapsed, canAccess } = useProjectStore();
  const router = useRouter();

  return (
    <div className="flex shrink-0 flex-col items-start justify-center p-4">
      <aside
        className={cn(
          "flex flex-col gap-1 rounded-2xl py-3",
          "border border-white/10 bg-[#111]/80 backdrop-blur-xl",
          "shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
          "transition-all duration-300 ease-in-out overflow-hidden",
          sidebarCollapsed ? "w-12 px-1.5" : "w-44 px-2"
        )}
      >
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          title="返回首页"
          className={cn(
            "flex items-center rounded-xl px-2 py-2 text-xs text-white/40 transition-colors hover:bg-white/5 hover:text-white/70 mb-1",
            sidebarCollapsed ? "justify-center" : "gap-2"
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          {!sidebarCollapsed && <span>返回首页</span>}
        </button>

        <div className={cn("h-px bg-white/8 mb-1", sidebarCollapsed ? "mx-1" : "mx-3")} />

        {/* Step items */}
        {STEPS.map((step, i) => {
          const isActive    = activeStep === step.key;
          const isCompleted = steps[step.key].completed;
          const isPast      = STEPS.findIndex((s) => s.key === activeStep) > i;
          const isLocked    = !canAccess(step.key);

          return (
            <button
              key={step.key}
              onClick={() => setActiveStep(step.key)}
              disabled={isLocked}
              title={sidebarCollapsed ? step.label : isLocked ? "请先完成上一步" : undefined}
              className={cn(
                "group flex items-center rounded-xl py-2.5 text-left transition-all duration-150",
                sidebarCollapsed ? "justify-center px-1.5" : "gap-3 px-3",
                isLocked
                  ? "cursor-not-allowed opacity-35"
                  : isActive
                  ? "bg-green-500/12 text-white"
                  : "text-white/40 hover:bg-white/5 hover:text-white/70"
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors",
                  isLocked
                    ? "border-white/10 text-white/20"
                    : isCompleted || isPast
                    ? "border-green-500 bg-green-500/20 text-green-400"
                    : isActive
                    ? "border-green-500 text-green-400"
                    : "border-white/20 text-white/30"
                )}
              >
                {isLocked ? <Lock className="h-2.5 w-2.5" /> : isCompleted || isPast ? <Check className="h-3 w-3" /> : step.index}
              </div>

              {!sidebarCollapsed && (
                <>
                  <span className="text-sm font-medium leading-none">{step.label}</span>
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-green-400" />}
                </>
              )}
            </button>
          );
        })}
      </aside>
    </div>
  );
}
