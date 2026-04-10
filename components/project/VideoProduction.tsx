"use client";

import { useRef, useEffect, useCallback } from "react";
import { Play, Pause, Camera, Volume2, Plus } from "lucide-react";
import { useVideoStore } from "@/store/useVideoStore";

const PX_PER_SEC = 80; // pixels per second on the timeline

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// Deterministic waveform bar height — avoids hydration mismatch
function waveHeight(clipIndex: number, barIndex: number): number {
  return (
    38 +
    Math.sin(barIndex * (1.3 + clipIndex * 0.4)) * 22 +
    Math.sin(barIndex * (0.7 + clipIndex * 0.2)) * 12
  );
}

/* ─── Preview ────────────────────────────────────────────────────────────── */
function PreviewArea() {
  const currentTime   = useVideoStore((s) => s.currentTime);
  const videoClips    = useVideoStore((s) => s.videoClips);
  const subtitleClips = useVideoStore((s) => s.subtitleClips);
  const showSubtitles = useVideoStore((s) => s.showSubtitles);

  const activeClip =
    videoClips.find((c) => currentTime >= c.start && currentTime < c.end) ??
    videoClips[videoClips.length - 1];

  const activeSub = subtitleClips.find(
    (c) => currentTime >= c.start && currentTime < c.end
  );

  return (
    <div
      className="relative w-full bg-black overflow-hidden"
      style={{ aspectRatio: "16/9" }}
    >
      {/* All image layers stacked; toggled via opacity */}
      {videoClips.map((clip) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={clip.id}
          src={clip.url}
          alt={clip.label}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          style={{ opacity: clip.id === activeClip?.id ? 1 : 0 }}
        />
      ))}

      {/* Subtitle overlay */}
      {showSubtitles && activeSub && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center px-10">
          <p
            className="text-white text-sm font-medium px-4 py-1.5 rounded text-center leading-snug"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}
          >
            {activeSub.text}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Controls bar ───────────────────────────────────────────────────────── */
function ControlsBar() {
  const currentTime   = useVideoStore((s) => s.currentTime);
  const duration      = useVideoStore((s) => s.duration);
  const isPlaying     = useVideoStore((s) => s.isPlaying);
  const showSubtitles = useVideoStore((s) => s.showSubtitles);
  const setPlaying    = useVideoStore((s) => s.setPlaying);
  const toggleSubs    = useVideoStore((s) => s.toggleSubtitles);

  return (
    <div className="flex items-center justify-between px-4 h-10 border-t border-b border-white/8 bg-[#0d0d0d] shrink-0">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-white/50">字幕</span>
        <button
          onClick={toggleSubs}
          className={`relative h-4 w-8 rounded-full transition-colors ${
            showSubtitles ? "bg-amber-400" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${
              showSubtitles ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <button
        onClick={() => setPlaying(!isPlaying)}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        {isPlaying
          ? <Pause className="h-3.5 w-3.5" />
          : <Play  className="h-3.5 w-3.5 translate-x-0.5" />}
      </button>

      <span className="w-28 text-right text-xs font-mono text-amber-400">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}

/* ─── Add-clip "+" button ────────────────────────────────────────────────── */
function AddClipBtn({ x }: { x: number }) {
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 z-10"
      style={{ left: x - 8 }}
    >
      <button className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-white/50 hover:bg-amber-400/80 hover:text-white transition-all">
        <Plus className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

/* ─── Timeline ───────────────────────────────────────────────────────────── */
function Timeline() {
  const currentTime    = useVideoStore((s) => s.currentTime);
  const duration       = useVideoStore((s) => s.duration);
  const videoClips     = useVideoStore((s) => s.videoClips);
  const subtitleClips  = useVideoStore((s) => s.subtitleClips);
  const audioClips     = useVideoStore((s) => s.audioClips);
  const setCurrentTime = useVideoStore((s) => s.setCurrentTime);

  const scrollRef  = useRef<HTMLDivElement>(null);
  const dragging   = useRef(false);
  const totalWidth = duration * PX_PER_SEC;
  const playheadX  = currentTime * PX_PER_SEC;

  const timeFromX = useCallback(
    (clientX: number): number => {
      const el = scrollRef.current;
      if (!el) return 0;
      const x = clientX - el.getBoundingClientRect().left + el.scrollLeft;
      return Math.max(0, Math.min(duration, x / PX_PER_SEC));
    },
    [duration]
  );

  const onMouseDown = (e: React.MouseEvent) => {
    // Only respond to clicks on the ruler or empty track area, not clip elements
    dragging.current = true;
    setCurrentTime(timeFromX(e.clientX));
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current) setCurrentTime(timeFromX(e.clientX));
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, [timeFromX, setCurrentTime]);

  // Auto-scroll to keep playhead in view
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, clientWidth } = el;
    const margin = 60;
    if (playheadX < scrollLeft + margin) {
      el.scrollLeft = Math.max(0, playheadX - margin);
    } else if (playheadX > scrollLeft + clientWidth - margin) {
      el.scrollLeft = playheadX - clientWidth + margin;
    }
  }, [playheadX]);

  // Tick every 5 s
  const ticks = Array.from(
    { length: Math.floor(duration / 5) + 1 },
    (_, i) => i * 5
  );

  return (
    <div className="flex shrink-0 border-t border-white/8 bg-[#111] select-none">
      {/* Fixed track labels */}
      <div className="flex shrink-0 flex-col w-16 border-r border-white/8 text-[10px] text-white/40">
        <div className="h-6 border-b border-white/5" />
        <div className="flex h-8  items-center justify-center border-b border-white/5">字幕</div>
        <div className="flex h-14 items-center justify-center border-b border-white/5">配音</div>
        <div className="flex h-20 items-center justify-center">分镜</div>
      </div>

      {/* Scrollable track area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden cursor-pointer"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}
        onMouseDown={onMouseDown}
      >
        <div className="relative" style={{ width: totalWidth }}>
          {/* Playhead — spans full height */}
          <div
            className="absolute top-0 bottom-0 w-px bg-amber-400 z-20 pointer-events-none"
            style={{ left: playheadX }}
          >
            <div className="absolute -top-0 -translate-x-[3px] border-x-[3px] border-x-transparent border-t-[5px] border-t-amber-400" />
          </div>

          {/* ── Ruler ── */}
          <div className="relative h-6 bg-[#0a0a0a] border-b border-white/8">
            {ticks.map((t) => (
              <div
                key={t}
                className="absolute top-0 flex flex-col"
                style={{ left: t * PX_PER_SEC }}
              >
                <div className="w-px h-2 bg-white/20" />
                <span className="pl-1 text-[9px] text-white/30">{formatTime(t)}</span>
              </div>
            ))}
          </div>

          {/* ── Subtitle track ── */}
          <div className="relative h-8 bg-[#0f0f0f] border-b border-white/5">
            {subtitleClips.map((clip, ci) => {
              const clipW = (clip.end - clip.start) * PX_PER_SEC - 2;
              return (
                <div
                  key={clip.id}
                  className="absolute inset-y-1 flex items-center gap-1.5 overflow-hidden rounded bg-sky-600/20 border border-sky-500/30 px-2"
                  style={{
                    left:  clip.start * PX_PER_SEC + 1,
                    width: clipW,
                  }}
                >
                  <span className="shrink-0 rounded bg-sky-500/30 px-1 py-px text-[8px] font-medium text-sky-300 leading-none">
                    旁白
                  </span>
                  {clipW > 80 && (
                    <span className="truncate text-[9px] text-sky-200/80">
                      {clip.text}
                    </span>
                  )}
                  {/* "+" between clips */}
                  {ci < subtitleClips.length - 1 && (
                    <AddClipBtn x={clipW - 2} />
                  )}
                </div>
              );
            })}
            {/* "+" after last subtitle clip */}
            {subtitleClips.length > 0 && (
              <AddClipBtn
                x={subtitleClips[subtitleClips.length - 1].end * PX_PER_SEC + 8}
              />
            )}
          </div>

          {/* ── Audio / dubbing track ── */}
          <div className="relative h-14 bg-[#0f0f0f] border-b border-white/5">
            {audioClips.map((clip, ci) => {
              const bars = Math.max(
                8,
                Math.floor(((clip.end - clip.start) * PX_PER_SEC - 24) / 5)
              );
              return (
                <div
                  key={clip.id}
                  className="absolute inset-y-1 flex items-center gap-px overflow-hidden rounded bg-violet-600/20 border border-violet-500/30 px-2"
                  style={{
                    left:  clip.start * PX_PER_SEC + 1,
                    width: (clip.end - clip.start) * PX_PER_SEC - 2,
                  }}
                >
                  <Volume2 className="h-2.5 w-2.5 shrink-0 text-violet-400/60 mr-1" />
                  <div className="flex flex-1 items-center gap-px h-full overflow-hidden">
                    {Array.from({ length: bars }, (_, bi) => (
                      <div
                        key={bi}
                        className="w-0.5 shrink-0 rounded-full bg-violet-400/70"
                        style={{ height: `${waveHeight(ci, bi)}%` }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Video / storyboard track ── */}
          <div className="relative h-20 bg-[#0f0f0f]">
            {videoClips.map((clip, idx) => (
              <div
                key={clip.id}
                className="absolute inset-y-1 overflow-hidden rounded border border-white/10 group"
                style={{
                  left:  clip.start * PX_PER_SEC + 1,
                  width: (clip.end - clip.start) * PX_PER_SEC - 2,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={clip.url}
                  alt={clip.label}
                  className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                {/* Dark gradient overlay at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/70 to-transparent" />
                {/* Camera icon top-left */}
                <div className="absolute top-1 left-1 flex items-center gap-0.5">
                  <Camera className="h-3 w-3 text-white/70" />
                </div>
                {/* Clip number bottom-left */}
                <div className="absolute bottom-1 left-1 flex h-4 w-4 items-center justify-center rounded bg-black/70 text-[9px] font-medium text-white/80">
                  {idx + 1}
                </div>
              </div>
            ))}
            {/* "+" after last video clip */}
            {videoClips.length > 0 && (
              <AddClipBtn
                x={videoClips[videoClips.length - 1].end * PX_PER_SEC + 8}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Root ───────────────────────────────────────────────────────────────── */
export default function VideoProduction() {
  const isPlaying      = useVideoStore((s) => s.isPlaying);
  const setCurrentTime = useVideoStore((s) => s.setCurrentTime);
  const setPlaying     = useVideoStore((s) => s.setPlaying);

  const rafRef    = useRef<number>(0);
  const lastTsRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      lastTsRef.current = 0;
      return;
    }

    const tick = (ts: number) => {
      if (lastTsRef.current === 0) {
        lastTsRef.current = ts;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const delta = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      const { currentTime, duration } = useVideoStore.getState();
      const next = currentTime + delta;

      if (next >= duration) {
        setCurrentTime(duration);
        setPlaying(false);
        return;
      }

      setCurrentTime(next);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTsRef.current = 0;
    };
  }, [isPlaying, setCurrentTime, setPlaying]);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-white/8">
      <div className="w-2/3 mx-auto">
        <PreviewArea />
      </div>
      <ControlsBar />
      <Timeline />
    </div>
  );
}
