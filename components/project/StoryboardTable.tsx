"use client";

import { ImageIcon, Plus, Download, Volume2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStoryboardStore, SCENE_TYPES, CAMERA_ANGLES, type Shot } from "@/store/useStoryboardStore";
import { useCharacterStore } from "@/store/useCharacterStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ─── Helpers ──────────────────────────────────────────────────────────── */
const SCENE_OPTIONS  = SCENE_TYPES.map((v)   => ({ label: v, value: v }));
const CAMERA_OPTIONS = CAMERA_ANGLES.map((v) => ({ label: v, value: v }));

/* ─── Image cell ───────────────────────────────────────────────────────── */
function ImageCell({ shot }: { shot: Shot }) {
  return (
    <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-lg bg-[#0d0d0d] border border-white/5">
      {shot.imageGenerated ? (
        <>
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br",
            shot.shotNumber === 1 ? "from-blue-950 via-indigo-900 to-slate-900" : "from-slate-900 via-zinc-800 to-neutral-900"
          )} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5">
            <ImageIcon className="h-3 w-3 text-white/60" />
          </div>
          <button className="absolute bottom-1.5 right-1.5 rounded bg-black/60 p-1 text-white/40 hover:text-white transition-colors">
            <Download className="h-3 w-3" />
          </button>
        </>
      ) : (
        <button className="flex flex-col items-center gap-1.5 text-white/20 hover:text-white/50 transition-colors">
          <ImageIcon className="h-7 w-7" />
          <span className="text-[10px]">生成画面</span>
        </button>
      )}
    </div>
  );
}

/* ─── Table row ────────────────────────────────────────────────────────── */
function ShotRow({ shot }: { shot: Shot }) {
  const { updateShot } = useStoryboardStore();
  const { characters }  = useCharacterStore();
  const up = (patch: Partial<Shot>) => updateShot(shot.id, patch);

  const charOptions = characters.map((c) => ({ label: c.name, value: c.id }));

  return (
    <tr className="group border-b border-white/5 hover:bg-white/[0.02] transition-colors align-top">
      {/* 镜号 */}
      <td className="w-12 px-2 py-3 text-center border-r border-white/5">
        <div className="flex flex-col items-center gap-1">
          <GripVertical className="h-4 w-4 text-white/15 cursor-grab group-hover:text-white/30 transition-colors" />
          <span className="text-xs font-medium text-white">{shot.shotNumber}</span>
        </div>
      </td>

      {/* 画面 */}
      <td className="w-40 px-2 py-3 border-r border-white/5">
        <ImageCell shot={shot} />
      </td>

      {/* 描述 */}
      <td className="px-3 py-3 border-r border-white/5">
        <textarea
          className="w-full resize-none bg-transparent text-xs text-white placeholder:text-white/20 outline-none leading-relaxed min-h-[80px]"
          value={shot.description} placeholder="镜头描述……"
          onChange={(e) => up({ description: e.target.value })}
        />
      </td>

      {/* 景别 */}
      <td className="w-24 px-2 py-3 border-r border-white/5">
        <Select value={shot.sceneType || ""} onValueChange={(v) => up({ sceneType: (v === "__clear__" ? "" : v) as typeof shot.sceneType })}>
          <SelectTrigger>
            <SelectValue placeholder={<span className="text-white/30">景别</span>} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__clear__"><span className="text-white/40">景别</span></SelectItem>
            <SelectSeparator />
            {SCENE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      {/* 镜头角度 */}
      <td className="w-24 px-2 py-3 border-r border-white/5">
        <Select value={shot.cameraAngle || ""} onValueChange={(v) => up({ cameraAngle: (v === "__clear__" ? "" : v) as typeof shot.cameraAngle })}>
          <SelectTrigger>
            <SelectValue placeholder={<span className="text-white/30">角度</span>} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__clear__"><span className="text-white/40">角度</span></SelectItem>
            <SelectSeparator />
            {CAMERA_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      {/* 旁白 */}
      <td className="w-44 px-3 py-3 border-r border-white/5">
        <textarea
          className="w-full resize-none bg-transparent text-xs text-white placeholder:text-white/20 outline-none leading-relaxed min-h-[60px]"
          value={shot.narration} placeholder="旁白……"
          onChange={(e) => up({ narration: e.target.value })}
        />
      </td>

      {/* 角色台词 */}
      <td className="w-52 px-3 py-3 border-r border-white/5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/50 shrink-0">角色</span>
            <div className="flex-1">
              <Select value={shot.characterId || ""} onValueChange={(v) => up({ characterId: v === "__clear__" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue placeholder={<span className="text-white/30">选择角色</span>} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__clear__"><span className="text-white/40">选择角色</span></SelectItem>
                  <SelectSeparator />
                  {charOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <textarea
            className="w-full resize-none bg-transparent text-xs text-white placeholder:text-white/20 outline-none leading-relaxed min-h-[50px]"
            value={shot.dialogue} placeholder="台词……"
            onChange={(e) => up({ dialogue: e.target.value })}
          />
        </div>
      </td>

      {/* 备注 */}
      <td className="w-24 px-3 py-3">
        <textarea
          className="w-full resize-none bg-transparent text-xs text-white placeholder:text-white/20 outline-none leading-relaxed min-h-[60px]"
          value={shot.notes} placeholder="备注……"
          onChange={(e) => up({ notes: e.target.value })}
        />
      </td>
    </tr>
  );
}

/* ─── Main ─────────────────────────────────────────────────────────────── */
const HEADERS = [
  { label: "镜号" },
  { label: "画面" },
  { label: "描述" },
  { label: "景别" },
  { label: "镜头角度" },
  { label: "旁白", icon: <Volume2 className="h-3 w-3 text-white/50" /> },
  { label: "角色台词" },
  { label: "备注" },
];

export default function StoryboardTable() {
  const { shots, addShot } = useStoryboardStore();

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-auto rounded-xl border border-white/8">
        <table className="w-full min-w-[900px] table-fixed border-collapse">
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
                  <div className="flex items-center justify-center gap-1">
                    {h.icon}
                    {h.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shots.map((shot) => <ShotRow key={shot.id} shot={shot} />)}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={addShot}
          className="flex items-center gap-2 rounded-lg border border-dashed border-white/10 px-4 py-2 text-xs text-white/40 hover:border-green-500/40 hover:text-green-400 transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> 添加镜头
        </button>
        <button className="flex items-center gap-2 rounded-lg bg-green-500/15 px-4 py-2 text-xs font-medium text-green-400 hover:bg-green-500/25 transition-colors">
          <ImageIcon className="h-3.5 w-3.5" /> 空白图批量生成
        </button>
      </div>
    </div>
  );
}
