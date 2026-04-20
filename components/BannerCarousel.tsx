"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeStore } from "@/store/useHomeStore";

const VISIBLE = 3;
const BANNER_GRADIENTS = [
  "from-violet-950 via-purple-900 to-indigo-950",
  "from-zinc-900 via-zinc-800 to-neutral-900",
  "from-yellow-950 via-amber-900 to-stone-900",
  "from-emerald-950 via-teal-900 to-slate-900",
  "from-blue-950 via-sky-900 to-slate-900",
] as const;

export default function BannerCarousel() {
  const { banners } = useHomeStore();
  const [offset, setOffset] = useState(0);

  const maxOffset = banners.length - VISIBLE;
  const prev = () => setOffset((o) => Math.max(0, o - 1));
  const next = () => setOffset((o) => Math.min(maxOffset, o + 1));

  const visible = banners.slice(offset, offset + VISIBLE);

  return (
    <div className="relative -mx-8">
      {/* Prev arrow */}
      <button
        onClick={prev}
        disabled={offset === 0}
        className={cn(
          "absolute left-1 top-[45%] z-20 -translate-y-1/2",
          "flex h-8 w-8 items-center justify-center rounded-full",
          "border border-white/15 bg-black/60 shadow-lg backdrop-blur-sm transition-all",
          "hover:border-white/30 hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-20"
        )}
      >
        <ChevronLeft className="h-4 w-4 text-white" />
      </button>

      {/* Cards row — bleed to edges */}
      <div className="flex gap-3 px-8 overflow-hidden">
        {visible.map((banner, i) => (
          <div key={banner.id} className="group flex-1 min-w-0 cursor-pointer space-y-3">
            {/* Card image area */}
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl bg-gradient-to-br h-[260px]",
                BANNER_GRADIENTS[(offset + i) % BANNER_GRADIENTS.length],
                "transition-transform duration-200 group-hover:scale-[1.015]",
                "shadow-lg group-hover:shadow-2xl group-hover:shadow-black/60"
              )}
            >
              {/* Cinematic bottom fade */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              {/* Blob decorations */}
              {[...Array(5)].map((_, j) => (
                <div
                  key={j}
                  className="absolute rounded-full bg-white/10 blur-3xl pointer-events-none"
                  style={{
                    width:  `${80 + j * 40}px`,
                    height: `${80 + j * 40}px`,
                    top:  `${(j * 25) % 70}%`,
                    left: `${(j * 20 + i * 15) % 80}%`,
                  }}
                />
              ))}
            </div>

            {/* Text below */}
            <div className="space-y-1.5 px-0.5">
              <p className="text-xs font-medium text-cyan-400/80 leading-none">
                {banner.category}
              </p>
              <h3 className="text-[15px] font-bold text-white leading-snug line-clamp-2 group-hover:text-white/90 transition-colors">
                {banner.title}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Next arrow */}
      <button
        onClick={next}
        disabled={offset >= maxOffset}
        className={cn(
          "absolute right-1 top-[45%] z-20 -translate-y-1/2",
          "flex h-8 w-8 items-center justify-center rounded-full",
          "border border-white/15 bg-black/60 shadow-lg backdrop-blur-sm transition-all",
          "hover:border-white/30 hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-20"
        )}
      >
        <ChevronRight className="h-4 w-4 text-white" />
      </button>

      {/* Dots */}
      <div className="mt-4 flex justify-center gap-1.5">
        {Array.from({ length: maxOffset + 1 }).map((_, i) => (
          <button
            key={i}
            onClick={() => setOffset(i)}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              offset === i ? "w-5 bg-white" : "w-1.5 bg-white/25 hover:bg-white/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}
