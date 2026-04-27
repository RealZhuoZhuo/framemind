"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export type MediaPreviewKind = "image" | "video";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogg"];

export function getMediaPreviewKind(url: string, fallback: MediaPreviewKind = "image") {
  const lower = url.toLowerCase();
  if (lower.startsWith("data:video/") || lower.startsWith("blob:")) return "video";

  try {
    const parsed = new URL(url, "https://local.invalid");
    const pathname = parsed.pathname.toLowerCase();
    return VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext)) ? "video" : fallback;
  } catch {
    const path = lower.split(/[?#]/)[0] ?? "";
    return VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext)) ? "video" : fallback;
  }
}

export function MediaPreviewModal({
  open,
  url,
  kind,
  title,
  onClose,
}: {
  open: boolean;
  url: string | null;
  kind?: MediaPreviewKind;
  title?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open || !url) return null;

  const mediaKind = kind ?? getMediaPreviewKind(url);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-6 py-8 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#101010] shadow-2xl">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/8 px-4">
          <div className="truncate text-sm font-medium text-white/75">{title ?? "预览"}</div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-white/45 transition-colors hover:bg-white/8 hover:text-white"
            aria-label="关闭预览"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-black">
          {mediaKind === "video" ? (
            <video src={url} controls className="max-h-[calc(100vh-9rem)] w-full bg-black" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={title ?? "预览"} className="max-h-[calc(100vh-9rem)] max-w-full object-contain" />
          )}
        </div>
      </div>
    </div>
  );
}
