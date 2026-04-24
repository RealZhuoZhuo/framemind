"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Download, GripVertical, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStoryboardStore, SCENE_TYPES, type Shot } from "@/store/useStoryboardStore";
import { useCharacterStore } from "@/store/useCharacterStore";
import { useProjectStore } from "@/store/useProjectStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SCENE_OPTIONS = SCENE_TYPES.map((v) => ({ label: v, value: v }));

function ImageCell({ shot }: { shot: Shot }) {
  return (
    <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-lg border border-white/5 bg-[#0d0d0d]">
      {shot.mediaUrl ? (
        <>
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              shot.shotNumber === 1
                ? "from-blue-950 via-indigo-900 to-slate-900"
                : "from-slate-900 via-zinc-800 to-neutral-900"
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5">
            <ImageIcon className="h-3 w-3 text-white/60" />
          </div>
          <button className="absolute bottom-1.5 right-1.5 rounded bg-black/60 p-1 text-white/40 transition-colors hover:text-white">
            <Download className="h-3 w-3" />
          </button>
        </>
      ) : (
        <button className="flex flex-col items-center gap-1.5 text-white/20 transition-colors hover:text-white/50">
          <ImageIcon className="h-7 w-7" />
          <span className="text-[10px]">生成画面</span>
        </button>
      )}
    </div>
  );
}

function ShotRow({ shot }: { shot: Shot }) {
  const { updateShot } = useStoryboardStore();
  const { characters } = useCharacterStore();
  const up = (patch: Partial<Shot>) => updateShot(shot.id, patch);

  const charOptions = characters.map((c) => ({ label: c.name, value: c.id }));

  return (
    <tr className="group align-top transition-colors hover:bg-white/[0.02] border-b border-white/5">
      <td className="w-12 border-r border-white/5 px-2 py-3 text-center">
        <div className="flex flex-col items-center gap-1">
          <GripVertical className="h-4 w-4 cursor-grab text-white/15 transition-colors group-hover:text-white/30" />
          <span className="text-xs font-medium text-white">{shot.shotNumber}</span>
        </div>
      </td>

      <td className="w-40 border-r border-white/5 px-2 py-3">
        <ImageCell shot={shot} />
      </td>

      <td className="w-24 border-r border-white/5 px-2 py-3">
        <Select
          value={shot.sceneType || ""}
          onValueChange={(v) => up({ sceneType: (v === "__clear__" ? "" : v) as typeof shot.sceneType })}
        >
          <SelectTrigger>
            <SelectValue placeholder={<span className="text-white/30">景别</span>} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__clear__">
              <span className="text-white/40">景别</span>
            </SelectItem>
            <SelectSeparator />
            {SCENE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      <td className="w-36 border-r border-white/5 px-3 py-3">
        <Select value={shot.characterId || ""} onValueChange={(v) => up({ characterId: v === "__clear__" ? null : v })}>
          <SelectTrigger>
            <SelectValue placeholder={<span className="text-white/30">角色</span>} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__clear__">
              <span className="text-white/40">角色</span>
            </SelectItem>
            <SelectSeparator />
            {charOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      <td className="w-52 border-r border-white/5 px-3 py-3">
        <textarea
          className="min-h-[70px] w-full resize-none bg-transparent text-xs leading-relaxed text-white outline-none placeholder:text-white/20"
          value={shot.characterAction}
          placeholder="角色动作……"
          onChange={(e) => up({ characterAction: e.target.value })}
        />
      </td>

      <td className="w-52 border-r border-white/5 px-3 py-3">
        <textarea
          className="min-h-[70px] w-full resize-none bg-transparent text-xs leading-relaxed text-white outline-none placeholder:text-white/20"
          value={shot.dialogue}
          placeholder="角色台词……"
          onChange={(e) => up({ dialogue: e.target.value })}
        />
      </td>

      <td className="px-3 py-3">
        <textarea
          className="min-h-[70px] w-full resize-none bg-transparent text-xs leading-relaxed text-white outline-none placeholder:text-white/20"
          value={shot.lightingMood}
          placeholder="氛围光影……"
          onChange={(e) => up({ lightingMood: e.target.value })}
        />
      </td>
    </tr>
  );
}

const HEADERS = [
  { label: "镜号" },
  { label: "画面" },
  { label: "景别" },
  { label: "角色" },
  { label: "角色动作" },
  { label: "角色台词" },
  { label: "氛围光影" },
];

export default function StoryboardTable() {
  const projectId = useProjectStore((s) => s.projectId);
  const { shots, isLoading, init, generateShots } = useStoryboardStore();
  const initCharacters = useCharacterStore((s) => s.init);
  const [generateError, setGenerateError] = useState("");

  useEffect(() => {
    if (!projectId) return;
    init(projectId);
    initCharacters(projectId);
  }, [projectId, init, initCharacters]);

  const handleGenerateShots = async () => {
    if (!projectId) return;
    setGenerateError("");
    try {
      await generateShots(projectId);
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "分镜生成失败");
    }
  };

  if (isLoading && shots.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <span className="text-sm text-white/30">加载中…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-white/35">基于当前剧本和角色字段自动生成分镜镜头，并写入镜头表。</div>
        <button
          onClick={() => { handleGenerateShots(); }}
          disabled={!projectId || isLoading}
          className="flex h-9 items-center gap-2 rounded-lg bg-green-500/15 px-4 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/25 disabled:opacity-40"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {isLoading ? "生成中…" : "AI生成分镜"}
        </button>
      </div>

      {generateError ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {generateError}
        </div>
      ) : null}

      <div className="overflow-auto rounded-xl border border-white/8">
        <table className="min-w-[980px] w-full table-fixed border-collapse">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.03]">
              {HEADERS.map((h, i) => (
                <th
                  key={i}
                  className={cn(
                    "px-3 py-2.5 text-center text-xs font-medium text-white",
                    i < HEADERS.length - 1 && "border-r border-white/8"
                  )}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{shots.map((shot) => <ShotRow key={shot.id} shot={shot} />)}</tbody>
        </table>
      </div>
    </div>
  );
}
