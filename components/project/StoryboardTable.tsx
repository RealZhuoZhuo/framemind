"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Images, GripVertical, MoreHorizontal, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStoryboardStore, SCENE_TYPES, type Shot } from "@/store/useStoryboardStore";
import { useAssetStore, type Asset, type AssetType } from "@/store/useAssetStore";
import { useProjectStore } from "@/store/useProjectStore";
import {
  getMediaPreviewKind,
  MediaPreviewModal,
  type MediaPreviewKind,
} from "@/components/project/MediaPreviewModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect, MultiSelectTag } from "@/components/ui/multi-select";

const SCENE_OPTIONS = SCENE_TYPES.map((v) => ({ label: v, value: v }));
const EMPTY_LABEL = <span className="text-white/30">无</span>;
const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  character: "角色",
  scene: "场景",
  prop: "道具",
};
const TABLE_SELECT_TRIGGER_CLASS =
  "min-h-[34px] rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 hover:border-white/20 hover:bg-white/8";

async function createShotVideoTask(projectId: string, shotId: string) {
  const response = await fetch(`/api/projects/${projectId}/shots/${shotId}/video`, {
    method: "POST",
  });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof payload.error === "string"
        ? payload.error
        : "视频生成任务创建失败"
    );
  }

  return payload &&
    typeof payload === "object" &&
    "taskId" in payload &&
    typeof payload.taskId === "string"
    ? payload.taskId
    : "";
}

function ImageCell({
  shot,
  onGenerate,
  onGenerateVideo,
  onPreview,
  isGenerating,
  isGeneratingVideo,
}: {
  shot: Shot;
  onGenerate: () => void;
  onGenerateVideo: () => void;
  onPreview: () => void;
  isGenerating: boolean;
  isGeneratingVideo: boolean;
}) {
  const mediaKind = shot.mediaUrl ? getMediaPreviewKind(shot.mediaUrl) : "image";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleImageAction = () => {
    setMenuOpen(false);
    onGenerate();
  };

  const handleVideoAction = () => {
    setMenuOpen(false);
    onGenerateVideo();
  };

  return (
    <div className="group relative flex h-36 w-full items-center justify-center overflow-hidden rounded-lg border border-white/5 bg-[#0d0d0d]">
      {shot.mediaUrl ? (
        <>
          <button
            type="button"
            onClick={onPreview}
            className="absolute inset-0 cursor-zoom-in"
            aria-label={`预览镜头 ${shot.shotNumber}`}
          >
            {mediaKind === "video" ? (
              <video src={shot.mediaUrl} muted preload="metadata" className="h-full w-full object-cover" />
            ) : (
              <img src={shot.mediaUrl} alt={`镜头 ${shot.shotNumber}`} className="h-full w-full object-cover" />
            )}
          </button>
        </>
      ) : (
        <button
          disabled={isGenerating}
          onClick={onGenerate}
          className="flex flex-col items-center gap-1.5 text-white/20 transition-colors hover:text-white/50 disabled:opacity-40"
        >
          <ImageIcon className="h-7 w-7" />
          <span className="text-[10px]">{isGenerating ? "生成中…" : "生成画面"}</span>
        </button>
      )}

      <div
        ref={menuRef}
        className={cn(
          "absolute left-1.5 top-1.5 z-20 transition-opacity",
          menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-white/20 bg-black/70 text-white/85 shadow-lg shadow-black/40 backdrop-blur transition-colors hover:border-green-400/50 hover:bg-black/85 hover:text-green-200"
          aria-label={`打开镜头 ${shot.shotNumber} 生成菜单`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {menuOpen ? (
          <div className="absolute left-0 top-8 min-w-[136px] rounded-xl border border-white/10 bg-[#1e1e1e] py-1 shadow-xl">
            <button
              type="button"
              onClick={handleImageAction}
              disabled={isGenerating}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-white/70 transition-colors hover:bg-white/6 hover:text-white disabled:opacity-40"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              图片生成
            </button>
            <button
              type="button"
              onClick={handleVideoAction}
              disabled={!shot.mediaUrl || isGeneratingVideo}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-white/70 transition-colors hover:bg-white/6 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Video className="h-3.5 w-3.5" />
              视频生成
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AssetTagsCell({
  shot,
  assets,
  onChange,
}: {
  shot: Shot;
  assets: Asset[];
  onChange: (assetIds: string[]) => void;
}) {
  const selectedAssets = assets.filter((asset) => shot.assetIds.includes(asset.id));
  const options = assets.map((asset) => ({
    value: asset.id,
    label: asset.name,
    meta: ASSET_TYPE_LABELS[asset.type],
    selectedLabel: `${ASSET_TYPE_LABELS[asset.type]} · ${asset.name}`,
  }));
  const selectedContent =
    selectedAssets.length > 0
      ? selectedAssets.map((asset) => (
          <MultiSelectTag key={asset.id}>
            {ASSET_TYPE_LABELS[asset.type]} · {asset.name}
          </MultiSelectTag>
        ))
      : undefined;

  return (
    <MultiSelect
      value={shot.assetIds}
      options={options}
      onValueChange={onChange}
      selectedContent={selectedContent}
      emptyText="暂无资产"
      triggerClassName={TABLE_SELECT_TRIGGER_CLASS}
      contentClassName="w-64"
      ariaLabel={`选择镜头 ${shot.shotNumber} 资产`}
    />
  );
}

function DialogueCell({
  shot,
  assets,
  onChange,
}: {
  shot: Shot;
  assets: Asset[];
  onChange: (patch: Partial<Shot>) => void;
}) {
  const characterAssets = assets.filter((asset) => asset.type === "character");
  const selectedSpeakerIds = shot.dialogueSpeakerIds ?? [];
  const selectedSpeakerIdSet = new Set(selectedSpeakerIds);
  const selectedSpeakers = characterAssets.filter((asset) => selectedSpeakerIdSet.has(asset.id));
  const fallbackSpeakerNames = shot.dialogueSpeaker
    .split(/[、,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const options = characterAssets.map((asset) => ({
    value: asset.id,
    label: asset.name,
    meta: "角色",
    selectedLabel: `角色 · ${asset.name}`,
  }));
  const selectedContent =
    selectedSpeakers.length > 0
      ? selectedSpeakers.map((speaker) => (
          <MultiSelectTag key={speaker.id}>角色 · {speaker.name}</MultiSelectTag>
        ))
      : fallbackSpeakerNames.length > 0
        ? fallbackSpeakerNames.map((speaker) => (
            <MultiSelectTag
              key={speaker}
              className="border-yellow-400/20 bg-yellow-400/10 text-yellow-100/80"
            >
              角色 · {speaker}
            </MultiSelectTag>
          ))
        : undefined;

  const handleSpeakerIdsChange = (nextIds: string[]) => {
    const nextNames = characterAssets
      .filter((candidate) => nextIds.includes(candidate.id))
      .map((candidate) => candidate.name);
    onChange({ dialogueSpeakerIds: nextIds, dialogueSpeaker: nextNames.join("、") });
  };

  return (
    <div className="relative flex flex-col gap-2">
      <MultiSelect
        value={selectedSpeakerIds}
        options={options}
        onValueChange={handleSpeakerIdsChange}
        selectedContent={selectedContent}
        emptyText="暂无角色资产"
        triggerClassName={TABLE_SELECT_TRIGGER_CLASS}
        contentClassName="w-64"
        ariaLabel={`选择镜头 ${shot.shotNumber} 台词角色`}
      />

      <textarea
        className="min-h-[70px] w-full resize-none bg-transparent text-xs leading-relaxed text-white outline-none placeholder:text-white/20"
        value={shot.dialogue}
        placeholder="无"
        onChange={(e) => onChange({ dialogue: e.target.value })}
      />
    </div>
  );
}

function ShotRow({
  shot,
  onPreviewMedia,
  onGenerationError,
  onVideoTaskCreated,
}: {
  shot: Shot;
  onPreviewMedia: (media: { url: string; title: string; kind: MediaPreviewKind }) => void;
  onGenerationError: (message: string) => void;
  onVideoTaskCreated: (message: string) => void;
}) {
  const { updateShot, generateShotImage } = useStoryboardStore();
  const projectId = useStoryboardStore((state) => state.projectId);
  const { assets } = useAssetStore();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const up = (patch: Partial<Shot>) => updateShot(shot.id, patch);

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
      await generateShotImage(shot.id);
    } catch (error) {
      onGenerationError(error instanceof Error ? error.message : "分镜图生成失败");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!projectId) return;

    setIsGeneratingVideo(true);
    try {
      const taskId = await createShotVideoTask(projectId, shot.id);
      onVideoTaskCreated(taskId ? `镜头 ${shot.shotNumber} 视频任务已创建：${taskId}` : `镜头 ${shot.shotNumber} 视频任务已创建`);
    } catch (error) {
      onGenerationError(error instanceof Error ? error.message : "视频生成任务创建失败");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <tr className="group align-top transition-colors hover:bg-white/[0.02] border-b border-white/5">
      <td className="w-12 border-r border-white/5 px-2 py-3 text-center">
        <div className="flex flex-col items-center gap-1">
          <GripVertical className="h-4 w-4 cursor-grab text-white/15 transition-colors group-hover:text-white/30" />
          <span className="text-xs font-medium text-white">{shot.shotNumber}</span>
        </div>
      </td>

      <td className="w-40 border-r border-white/5 px-2 py-3">
        <ImageCell
          shot={shot}
          onGenerate={handleGenerateImage}
          onGenerateVideo={handleGenerateVideo}
          onPreview={() => {
            if (!shot.mediaUrl) return;
            onPreviewMedia({
              url: shot.mediaUrl,
              title: `镜头 ${shot.shotNumber}`,
              kind: getMediaPreviewKind(shot.mediaUrl),
            });
          }}
          isGenerating={isGeneratingImage}
          isGeneratingVideo={isGeneratingVideo}
        />
      </td>

      <td className="w-24 border-r border-white/5 px-2 py-3">
        <Select
          value={shot.sceneType || ""}
          onValueChange={(v) => up({ sceneType: (v === "__clear__" ? "" : v) as typeof shot.sceneType })}
        >
          <SelectTrigger className={cn(TABLE_SELECT_TRIGGER_CLASS, "[&>span]:text-center")}>
            <SelectValue placeholder={EMPTY_LABEL} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__clear__">
              <span className="text-white/40">无</span>
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

      <td className="w-56 border-r border-white/5 px-3 py-3">
        <AssetTagsCell shot={shot} assets={assets} onChange={(assetIds) => up({ assetIds })} />
      </td>

      <td className="w-60 border-r border-white/5 px-3 py-3">
        <textarea
          className="min-h-[70px] w-full resize-none bg-transparent text-xs leading-relaxed text-white outline-none placeholder:text-white/20"
          value={shot.shotDescription}
          placeholder="无"
          onChange={(e) => up({ shotDescription: e.target.value })}
        />
      </td>

      <td className="w-52 border-r border-white/5 px-3 py-3">
        <textarea
          className="min-h-[70px] w-full resize-none bg-transparent text-xs leading-relaxed text-white outline-none placeholder:text-white/20"
          value={shot.characterAction}
          placeholder="无"
          onChange={(e) => up({ characterAction: e.target.value })}
        />
      </td>

      <td className="w-64 border-r border-white/5 px-3 py-3">
        <DialogueCell shot={shot} assets={assets} onChange={up} />
      </td>

      <td className="px-3 py-3">
        <textarea
          className="min-h-[70px] w-full resize-none bg-transparent text-xs leading-relaxed text-white outline-none placeholder:text-white/20"
          value={shot.lightingMood}
          placeholder="无"
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
  { label: "资产" },
  { label: "分镜描述" },
  { label: "角色动作" },
  { label: "角色台词" },
  { label: "氛围光影" },
];

export default function StoryboardTable() {
  const projectId = useProjectStore((s) => s.projectId);
  const {
    shots,
    isLoading,
    isGeneratingAllImages,
    imageGenerationProgress,
    init,
    generateAllShotImages,
  } = useStoryboardStore();
  const initAssets = useAssetStore((s) => s.init);
  const [generateError, setGenerateError] = useState("");
  const [generateNotice, setGenerateNotice] = useState("");
  const [isGeneratingAllVideos, setIsGeneratingAllVideos] = useState(false);
  const [videoGenerationProgress, setVideoGenerationProgress] = useState({ completed: 0, total: 0 });
  const [preview, setPreview] = useState<{ url: string; title: string; kind: MediaPreviewKind } | null>(null);

  useEffect(() => {
    if (!projectId) return;
    init(projectId);
    initAssets(projectId);
  }, [projectId, init, initAssets]);

  const handleGenerateAllShotImages = async () => {
    setGenerateError("");
    setGenerateNotice("");
    try {
      await generateAllShotImages();
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "批量生成分镜图失败");
    }
  };

  const handleGenerateAllShotVideos = async () => {
    if (!projectId) return;

    const shotsWithImages = shots.filter((shot) => Boolean(shot.mediaUrl));
    setGenerateError("");
    setGenerateNotice("");

    if (shotsWithImages.length === 0) {
      setGenerateError("暂无可生成视频的分镜图，请先生成分镜图");
      return;
    }

    setIsGeneratingAllVideos(true);
    setVideoGenerationProgress({ completed: 0, total: shotsWithImages.length });

    const failed: number[] = [];
    let createdCount = 0;

    for (const [index, shot] of shotsWithImages.entries()) {
      try {
        await createShotVideoTask(projectId, shot.id);
        createdCount += 1;
      } catch (error) {
        failed.push(shot.shotNumber);
        console.error(`Failed to create storyboard video task for shot ${shot.shotNumber}:`, error);
      } finally {
        setVideoGenerationProgress({ completed: index + 1, total: shotsWithImages.length });
      }
    }

    setIsGeneratingAllVideos(false);

    if (createdCount > 0) {
      setGenerateNotice(`已创建 ${createdCount} 个分镜视频任务`);
    }
    if (failed.length > 0) {
      setGenerateError(`${failed.length} 个分镜视频任务创建失败：${failed.join("、")}`);
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
        <div className="text-xs text-white/35">基于当前剧本和资产表自动生成分镜镜头，并绑定相关资产。</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { handleGenerateAllShotImages(); }}
            disabled={!projectId || shots.length === 0 || isLoading || isGeneratingAllImages || isGeneratingAllVideos}
            className="flex h-9 items-center gap-2 rounded-lg bg-white/8 px-4 text-xs font-medium text-white/70 transition-colors hover:bg-white/14 hover:text-white disabled:opacity-40"
          >
            <Images className="h-3.5 w-3.5" />
            {isGeneratingAllImages
              ? `生成 ${imageGenerationProgress.completed}/${imageGenerationProgress.total}`
              : "生成全部分镜图"}
          </button>
          <button
            onClick={() => { handleGenerateAllShotVideos(); }}
            disabled={
              !projectId ||
              shots.length === 0 ||
              shots.every((shot) => !shot.mediaUrl) ||
              isLoading ||
              isGeneratingAllImages ||
              isGeneratingAllVideos
            }
            className="flex h-9 items-center gap-2 rounded-lg bg-white/8 px-4 text-xs font-medium text-white/70 transition-colors hover:bg-white/14 hover:text-white disabled:opacity-40"
          >
            <Video className="h-3.5 w-3.5" />
            {isGeneratingAllVideos
              ? `视频 ${videoGenerationProgress.completed}/${videoGenerationProgress.total}`
              : "生成全部分镜视频"}
          </button>
        </div>
      </div>

      {generateError ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {generateError}
        </div>
      ) : null}

      {generateNotice ? (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs text-green-200">
          {generateNotice}
        </div>
      ) : null}

      <div className="overflow-auto rounded-xl border border-white/8">
        <table className="min-w-[1400px] w-full table-fixed border-collapse">
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
          <tbody>
            {shots.map((shot) => (
              <ShotRow
                key={shot.id}
                shot={shot}
                onPreviewMedia={setPreview}
                onGenerationError={(message) => {
                  setGenerateNotice("");
                  setGenerateError(message);
                }}
                onVideoTaskCreated={(message) => {
                  setGenerateError("");
                  setGenerateNotice(message);
                }}
              />
            ))}
          </tbody>
        </table>
      </div>

      <MediaPreviewModal
        open={Boolean(preview)}
        url={preview?.url ?? null}
        title={preview?.title}
        kind={preview?.kind}
        onClose={() => setPreview(null)}
      />
    </div>
  );
}
