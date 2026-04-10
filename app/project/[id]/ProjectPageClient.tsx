"use client";

import { useEffect } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import ProjectSidebar from "@/components/project/ProjectSidebar";
import StepContent from "@/components/project/StepContent";

export default function ProjectPageClient({ projectId }: { projectId: string }) {
  const init = useProjectStore((s) => s.init);
  const isLoading = useProjectStore((s) => s.isLoading);

  useEffect(() => {
    init(projectId);
  }, [projectId, init]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <span className="text-sm text-white/30">加载中…</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      <ProjectSidebar />
      <StepContent />
    </div>
  );
}
