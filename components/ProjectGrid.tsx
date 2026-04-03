"use client";

import { Plus, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useHomeStore } from "@/store/useHomeStore";

function CreateCard({ onClick }: { onClick?: () => void }) {
  return (
    <div className="flex flex-col gap-2.5">
      <button
        onClick={onClick}
        className={cn(
          "group relative flex aspect-video w-full flex-col items-center justify-center gap-2",
          "overflow-hidden rounded-2xl border border-white/10 bg-[#161616]",
          "transition-all duration-200 hover:border-white/20 hover:bg-[#1c1c1c]"
        )}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-colors group-hover:border-green-500/40 group-hover:bg-green-500/10">
          <Plus className="h-4 w-4 text-white/50 group-hover:text-green-400 transition-colors" />
        </div>
        <span className="text-sm text-white/40 group-hover:text-white/60 transition-colors">
          开始创作
        </span>
      </button>
      <p className="text-xs text-white/35 px-0.5">创建新的视频项目</p>
    </div>
  );
}

function ProjectCard({
  title,
  gradient,
  updatedAt,
}: {
  title: string;
  gradient: string;
  updatedAt?: string;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div
        className={cn(
          "group relative aspect-video w-full overflow-hidden rounded-2xl",
          `bg-gradient-to-br ${gradient}`,
          "cursor-pointer transition-transform duration-200 hover:scale-[1.02]",
          "shadow-md hover:shadow-lg hover:shadow-black/40"
        )}
      >
        {/* Cinematic overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      {/* Below card: title + date left, menu right */}
      <div className="flex items-start justify-between px-0.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-white leading-tight">{title}</span>
          {updatedAt && (
            <span className="text-xs text-white/35">{updatedAt}</span>
          )}
        </div>
        <button className="mt-0.5 rounded-md p-1 text-white/30 hover:bg-white/8 hover:text-white/60 transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function ProjectGrid() {
  const { projects, addProject } = useHomeStore();
  const router = useRouter();

  const handleNewProject = () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;
    addProject({
      id: String(Date.now()),
      title: "未命名",
      gradient: "from-slate-800 via-slate-700 to-slate-900",
      updatedAt: dateStr,
    });
    router.push("/project");
  };

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-white/80">最近项目</h2>
      <div className="grid grid-cols-3 gap-4">
        <CreateCard onClick={handleNewProject} />
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            title={project.title}
            gradient={project.gradient}
            updatedAt={project.updatedAt}
          />
        ))}
      </div>
    </section>
  );
}
