"use client";

import { Plus, Pencil, Mic, UserCircle2, MoreHorizontal, Play, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCharacterStore, type Character } from "@/store/useCharacterStore";

function CharacterCard({ char }: { char: Character }) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border-2 bg-[#111] overflow-hidden transition-all duration-200",
        char.borderColor,
        "hover:shadow-lg hover:shadow-black/40"
      )}
    >
      {/* Top action bar */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <button className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-white hover:bg-white/10 transition-colors">
            <Pencil className="h-3 w-3" /> 编辑角色
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-white hover:bg-white/10 transition-colors">
            <Mic className="h-3 w-3" /> 编辑声音
          </button>
        </div>
        <button className="flex h-6 w-6 items-center justify-center rounded-md text-white/30 hover:bg-white/8 hover:text-white/70 transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Image area */}
      <div className={cn("relative flex h-40 items-center justify-center bg-gradient-to-b", char.gradientFrom, "to-[#111]")}>
        <UserCircle2 className="h-20 w-20 text-white/10" />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 px-4 pt-3 pb-2">
        <h3 className="text-center text-sm font-bold text-white">{char.name}</h3>
        <p className="line-clamp-3 text-xs leading-relaxed text-white">{char.description}</p>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center gap-2 px-4 pb-4 pt-1">
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 py-1.5 text-xs text-white hover:bg-white/10 transition-colors">
          <Play className="h-3 w-3" /> 预览
        </button>
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 py-1.5 text-xs text-white hover:bg-white/10 transition-colors">
          <Download className="h-3 w-3" /> 下载
        </button>
      </div>
    </div>
  );
}

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

const BORDER_COLORS = [
  { borderColor: "border-yellow-500/60", gradientFrom: "from-yellow-900/30" },
  { borderColor: "border-green-500/60",  gradientFrom: "from-green-900/30"  },
  { borderColor: "border-purple-500/60", gradientFrom: "from-purple-900/30" },
  { borderColor: "border-blue-500/60",   gradientFrom: "from-blue-900/30"   },
  { borderColor: "border-rose-500/60",   gradientFrom: "from-rose-900/30"   },
];

export default function CharacterDesign() {
  const { characters, addCharacter } = useCharacterStore();

  const handleAdd = () => {
    const style = BORDER_COLORS[characters.length % BORDER_COLORS.length];
    addCharacter({
      id: String(Date.now()),
      name: "新角色",
      description: "请填写角色描述……",
      ...style,
    });
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      {characters.map((c) => (
        <CharacterCard key={c.id} char={c} />
      ))}
      <AddCard onClick={handleAdd} />
    </div>
  );
}
