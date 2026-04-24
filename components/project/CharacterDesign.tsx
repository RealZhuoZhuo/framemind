"use client";

import { useEffect, useRef, useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { Plus, Mic, UserCircle2, MoreHorizontal, Play, Download, Pencil, Trash2, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCharacterStore, type Character } from "@/store/useCharacterStore";

// ─── Edit Modal ────────────────────────────────────────────────────────────────

type EditFields = Pick<Character, "name" | "appearance" | "description">;

function EditCharacterModal({
  initial,
  onClose,
  onSave,
}: {
  initial: EditFields;
  onClose: () => void;
  onSave: (data: EditFields) => void | Promise<void>;
}) {
  const [form, setForm] = useState<EditFields>(initial);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const set = (key: keyof EditFields, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      await onSave(form);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex w-[780px] max-h-[88vh] overflow-hidden rounded-2xl border border-white/10 bg-[#161616] shadow-2xl">
        {/* Header */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/8 bg-[#161616] px-7 py-4">
          <h2 className="text-sm font-semibold text-white">角色编辑</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 hover:bg-white/8 hover:text-white/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex w-full pt-[57px] pb-[61px] overflow-hidden">
          {/* Left: image preview — half width, full height */}
          <div className="relative flex w-1/2 shrink-0 flex-col items-center justify-center border-r border-white/8 bg-[#111]">
            <UserCircle2 className="h-24 w-24 text-white/10" />
            <span className="mt-3 text-[11px] text-white/25">请生成角色形象</span>
            <button className="absolute bottom-6 rounded-lg bg-white/8 px-5 py-2 text-xs text-white/50 hover:bg-white/14 hover:text-white/70 transition-colors">
              生成形象
            </button>
          </div>

          {/* Right: scrollable form */}
          <div className="flex w-1/2 flex-col gap-4 overflow-y-auto px-7 py-6">
            {/* 名称 */}
            <Field label="名称">
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputCls}
              />
            </Field>

            {/* 外貌 */}
            <Field label="外貌">
              <textarea
                rows={3}
                value={form.appearance}
                onChange={(e) => set("appearance", e.target.value)}
                className={textareaCls}
              />
            </Field>

            {/* 角色描述 */}
            <Field label="角色描述">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className={textareaCls}
              />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute inset-x-0 bottom-0 flex justify-end gap-3 border-t border-white/8 bg-[#161616] px-7 py-4">
          {errorMessage ? (
            <div className="mr-auto flex items-center rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}
          <button
            onClick={onClose}
            className="h-9 rounded-lg px-5 text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            取消
          </button>
          <button
            disabled={loading}
            onClick={() => { handleSave(); }}
            className="h-9 rounded-lg bg-green-500 px-6 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {loading ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-white/20 focus:border-green-500/40 focus:outline-none transition-colors";
const textareaCls =
  "w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-green-500/40 focus:outline-none transition-colors leading-relaxed";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-white/40">{label}</label>
      {children}
    </div>
  );
}

// ─── Character Card ────────────────────────────────────────────────────────────

function CharacterCard({
  char,
  onEdit,
  onDelete,
}: {
  char: Character;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border-2 bg-[#111] overflow-hidden transition-all duration-200",
        char.borderColor,
        "hover:shadow-lg hover:shadow-black/40"
      )}
    >
      {/* Three-dot menu */}
      <div ref={menuRef} className="absolute right-2.5 top-2.5 z-10">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 hover:bg-white/10 hover:text-white/70 transition-colors"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-8 min-w-[130px] rounded-xl border border-white/10 bg-[#1e1e1e] py-1 shadow-xl">
            <MenuItem icon={<Pencil className="h-3.5 w-3.5" />}  label="编辑角色" onClick={() => { setMenuOpen(false); onEdit(); }} />
            <MenuItem icon={<Mic className="h-3.5 w-3.5" />}     label="编辑声音" onClick={() => setMenuOpen(false)} />
            <MenuItem icon={<Play className="h-3.5 w-3.5" />}    label="预览"     onClick={() => setMenuOpen(false)} />
            <MenuItem icon={<Download className="h-3.5 w-3.5" />} label="下载"   onClick={() => setMenuOpen(false)} />
            <div className="my-1 border-t border-white/8" />
            <MenuItem icon={<Trash2 className="h-3.5 w-3.5" />}  label="删除" onClick={() => { setMenuOpen(false); onDelete(); }} danger />
          </div>
        )}
      </div>

      {/* Image area */}
      <div className={cn("relative flex h-44 items-center justify-center bg-gradient-to-b", char.gradientFrom, "to-[#111]")}>
        <UserCircle2 className="h-20 w-20 text-white/10" />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
        <h3 className="text-center text-sm font-bold text-white">{char.name}</h3>
        <p className="line-clamp-3 text-xs leading-relaxed text-white/60">{char.description}</p>
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3.5 py-2 text-sm transition-colors",
        danger
          ? "text-red-400/80 hover:bg-red-500/8 hover:text-red-400"
          : "text-white/60 hover:bg-white/6 hover:text-white"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Add Card ──────────────────────────────────────────────────────────────────

function AddCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/10",
        "bg-[#111] transition-all duration-200 hover:border-green-500/40 hover:bg-green-500/5",
        "min-h-[300px]"
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors group-hover:border-green-500/40 group-hover:bg-green-500/10">
        <Plus className="h-5 w-5 text-white/30 group-hover:text-green-400 transition-colors" />
      </div>
      <span className="text-xs text-white/30 group-hover:text-white/60 transition-colors">添加角色</span>
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────��──────────────────

export default function CharacterDesign() {
  const projectId = useProjectStore((s) => s.projectId);
  const { characters, isLoading, init, addCharacter, updateCharacter, removeCharacter, generateCharacters } = useCharacterStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [generateError, setGenerateError] = useState("");

  useEffect(() => {
    if (projectId) init(projectId);
  }, [projectId, init]);

  const editingChar = characters.find((c) => c.id === editingId) ?? null;

  const handleGenerateCharacters = async () => {
    if (!projectId) return;
    setGenerateError("");
    try {
      await generateCharacters(projectId);
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "角色生成失败");
    }
  };

  if (isLoading && characters.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <span className="text-sm text-white/30">加载中…</span>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-xs text-white/35">基于已保存剧本自动提取角色，并写入当前角色字段。</div>
        <button
          onClick={() => { handleGenerateCharacters(); }}
          disabled={!projectId || isLoading}
          className="flex h-9 items-center gap-2 rounded-lg bg-green-500/15 px-4 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/25 disabled:opacity-40"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {isLoading ? "生成中…" : "AI生成角色"}
        </button>
      </div>

      {generateError ? (
        <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {generateError}
        </div>
      ) : null}

      <div className="grid grid-cols-4 gap-4">
        {characters.map((c) => (
          <CharacterCard
            key={c.id}
            char={c}
            onEdit={() => setEditingId(c.id)}
            onDelete={() => removeCharacter(c.id)}
          />
        ))}
        <AddCard onClick={() => setAdding(true)} />
      </div>

      {/* Add modal */}
      {adding && (
        <EditCharacterModal
          initial={{ name: "", appearance: "", description: "" }}
          onClose={() => setAdding(false)}
          onSave={async (data) => {
            if (projectId) await addCharacter(projectId, data);
            setAdding(false);
          }}
        />
      )}

      {/* Edit modal */}
      {editingChar && (
        <EditCharacterModal
          initial={{
            name: editingChar.name,
            appearance: editingChar.appearance,
            description: editingChar.description,
          }}
          onClose={() => setEditingId(null)}
          onSave={(data) => updateCharacter(editingChar.id, data)}        />
      )}
    </>
  );
}
