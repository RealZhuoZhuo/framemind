"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import NewProjectModal from "@/components/NewProjectModal";

type Project = {
  id: string;
  title: string;
  updatedAt: string;
};

type ProjectRow = {
  id: string;
  title: string;
  updatedAt: string;
};

const PROJECT_CARD_GRADIENT = "from-slate-800 via-slate-700 to-slate-900";

async function readJsonOrThrow<T>(res: Response): Promise<T> {
  const payload = await res.json();

  if (!res.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "Request failed";
    throw new Error(message);
  }

  return payload as T;
}

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
  project,
  onCardClick,
  onRename,
  onDelete,
}: {
  project: Project;
  onCardClick: () => void;
  onRename: (id: string, currentTitle: string) => void;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className="flex flex-col gap-2.5">
      <div
        onClick={onCardClick}
        className={cn(
          "group relative aspect-video w-full overflow-hidden rounded-2xl",
          `bg-gradient-to-br ${PROJECT_CARD_GRADIENT}`,
          "cursor-pointer transition-transform duration-200 hover:scale-[1.02]",
          "shadow-md hover:shadow-lg hover:shadow-black/40"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      <div className="flex items-start justify-between px-0.5">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="truncate text-sm font-medium text-white leading-tight">{project.title}</span>
          {project.updatedAt && (
            <span className="text-xs text-white/35">{project.updatedAt}</span>
          )}
        </div>

        {/* Three-dot menu */}
        <div ref={menuRef} className="relative ml-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="mt-0.5 rounded-md p-1 text-white/30 hover:bg-white/8 hover:text-white/60 transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-7 z-20 min-w-[130px] rounded-xl border border-white/10 bg-[#1e1e1e] py-1 shadow-xl">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onRename(project.id, project.title); }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-white/60 hover:bg-white/6 hover:text-white transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                重命名
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(project.id); }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-red-400/80 hover:bg-red-500/8 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                删除
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RenameModal({
  initialTitle,
  onClose,
  onConfirm,
}: {
  initialTitle: string;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void>;
}) {
  const [value, setValue] = useState(initialTitle);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const handleConfirm = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await onConfirm(trimmed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-[400px] rounded-2xl border border-white/10 bg-[#161616] p-7 shadow-2xl">
        <h2 className="mb-5 text-base font-semibold text-white">重命名项目</h2>
        <input
          ref={inputRef}
          type="text"
          maxLength={60}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); if (e.key === "Escape") onClose(); }}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-green-500/40 focus:outline-none transition-colors"
        />
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-9 rounded-lg px-5 text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            取消
          </button>
          <button
            disabled={!value.trim() || loading}
            onClick={handleConfirm}
            className="h-9 rounded-lg bg-green-500 px-6 text-sm font-semibold text-black transition-opacity disabled:opacity-40 hover:opacity-90"
          >
            {loading ? "保存中…" : "确认"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export default function ProjectGrid() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => readJsonOrThrow<ProjectRow[] | { error: string }>(r))
      .then((rows) =>
        setProjects(
          (Array.isArray(rows) ? rows : []).map((p) => ({
            id: p.id,
            title: p.title,
            updatedAt: formatDate(p.updatedAt),
          }))
        )
      )
      .catch(console.error);
  }, []);

  const handleCreate = async ({ name, videoMode, aspectRatio, visualStyle }: { name: string; videoMode: string; aspectRatio: string; visualStyle: string }) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: name,
        videoMode,
        aspectRatio,
        visualStyle,
      }),
    });
    const project = await readJsonOrThrow<{ id: string }>(res);
    router.push(`/project/${project.id}`);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!res.ok) {
      throw new Error("Failed to delete project");
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleRename = async (name: string) => {
    if (!renaming) return;
    const res = await fetch(`/api/projects/${renaming.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: name }),
    });
    await readJsonOrThrow(res);
    setProjects((prev) =>
      prev.map((p) => (p.id === renaming.id ? { ...p, title: name } : p))
    );
    setRenaming(null);
  };

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-white/80">最近项目</h2>
        <div className="grid grid-cols-3 gap-4">
          <CreateCard onClick={() => setShowCreateModal(true)} />
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onCardClick={() => router.push(`/project/${project.id}`)}
              onRename={(id, title) => setRenaming({ id, title })}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </section>

      {showCreateModal && (
        <NewProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}

      {renaming && (
        <RenameModal
          initialTitle={renaming.title}
          onClose={() => setRenaming(null)}
          onConfirm={handleRename}
        />
      )}
    </>
  );
}
