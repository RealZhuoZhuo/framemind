"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Images, GripVertical, Sparkles } from "lucide-react";
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

const SCENE_OPTIONS = SCENE_TYPES.map((v) => ({ label: v, value: v }));
const EMPTY_LABEL = <span className="text-white/30">无</span>;
const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  character: "角色",
  scene: "场景",
  prop: "道具",
};

function ImageCell({
  shot,
  onGenerate,
  onPreview,
  isGenerating,
}: {
  shot: Shot;
  onGenerate: () => void;
  onPreview: () => void;
  isGenerating: boolean;
}) {
  const mediaKind = shot.mediaUrl ? getMediaPreviewKind(shot.mediaUrl) : "image";

  return (
    <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-lg border border-white/5 bg-[#0d0d0d]">
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
  const [open, setOpen] = useState(false);
  const selectedAssets = assets.filter((asset) => shot.assetIds.includes(asset.id));

  const toggleAsset = (assetId: string) => {
    const next = shot.assetIds.includes(assetId)
      ? shot.assetIds.filter((id) => id !== assetId)
      : [...shot.assetIds, assetId];
    onChange(next);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-[34px] w-full flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-left text-xs text-white/60 hover:border-white/20 hover:bg-white/8"
      >
        {selectedAssets.length > 0 ? (
          selectedAssets.map((asset) => (
            <span key={asset.id} className="max-w-full truncate rounded border border-white/10 bg-white/8 px-1.5 py-0.5 text-[10px] text-white/70">
              {ASSET_TYPE_LABELS[asset.type]} · {asset.name}
            </span>
          ))
        ) : (
          <span className="text-white/30">无</span>
        )}
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-20 max-h-72 w-64 overflow-auto rounded-lg border border-white/10 bg-[#1b1b1b] p-1.5 shadow-xl">
          {assets.length > 0 ? (
            assets.map((asset) => (
              <label key={asset.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-white/65 hover:bg-white/6">
                <input
                  type="checkbox"
                  checked={shot.assetIds.includes(asset.id)}
                  onChange={() => toggleAsset(asset.id)}
                  className="h-3.5 w-3.5 accent-green-500"
                />
                <span className="shrink-0 text-white/35">{ASSET_TYPE_LABELS[asset.type]}</span>
                <span className="truncate">{asset.name}</span>
              </label>
            ))
          ) : (
            <div className="px-2 py-4 text-center text-xs text-white/30">暂无资产</div>
          )}
        </div>
      ) : null}
    </div>
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
  const [open, setOpen] = useState(false);
  const characterAssets = assets.filter((asset) => asset.type === "character");
  const selectedSpeakerIds = shot.dialogueSpeakerIds ?? [];
  const selectedSpeakerIdSet = new Set(selectedSpeakerIds);
  const selectedSpeakers = characterAssets.filter((asset) => selectedSpeakerIdSet.has(asset.id));
  const fallbackSpeakerNames = shot.dialogueSpeaker
    .split(/[、,，]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const toggleSpeaker = (asset: Asset) => {
    const nextIds = selectedSpeakerIdSet.has(asset.id)
      ? selectedSpeakerIds.filter((speakerId) => speakerId !== asset.id)
      : [...selectedSpeakerIds, asset.id];
    const nextNames = characterAssets
      .filter((candidate) => nextIds.includes(candidate.id))
      .map((candidate) => candidate.name);
    onChange({ dialogueSpeakerIds: nextIds, dialogueSpeaker: nextNames.join("、") });
  };

  return (
    <div className="relative flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-[34px] w-full flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-left text-xs text-white/60 hover:border-white/20 hover:bg-white/8"
      >
        {selectedSpeakers.length > 0 ? (
          selectedSpeakers.map((speaker) => (
            <span key={speaker.id} className="max-w-full truncate rounded border border-white/10 bg-white/8 px-1.5 py-0.5 text-[10px] text-white/70">
              角色 · {speaker.name}
            </span>
          ))
        ) : fallbackSpeakerNames.length > 0 ? (
          fallbackSpeakerNames.map((speaker) => (
            <span key={speaker} className="max-w-full truncate rounded border border-yellow-400/20 bg-yellow-400/10 px-1.5 py-0.5 text-[10px] text-yellow-100/80">
              角色 · {speaker}
            </span>
          ))
        ) : (
          <span className="text-white/30">无</span>
        )}
      </button>

      {open ? (
        <div className="absolute left-0 top-[40px] z-20 max-h-72 w-64 overflow-auto rounded-lg border border-white/10 bg-[#1b1b1b] p-1.5 shadow-xl">
          {characterAssets.length > 0 ? (
            characterAssets.map((asset) => (
              <label key={asset.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-white/65 hover:bg-white/6">
                <input
                  type="checkbox"
                  checked={selectedSpeakerIdSet.has(asset.id)}
                  onChange={() => toggleSpeaker(asset)}
                  className="h-3.5 w-3.5 accent-green-500"
                />
                <span className="shrink-0 text-white/35">角色</span>
                <span className="truncate">{asset.name}</span>
              </label>
            ))
          ) : (
            <div className="px-2 py-4 text-center text-xs text-white/30">暂无角色资产</div>
          )}
        </div>
      ) : null}

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
}: {
  shot: Shot;
  onPreviewMedia: (media: { url: string; title: string; kind: MediaPreviewKind }) => void;
}) {
  const { updateShot, generateShotImage } = useStoryboardStore();
  const { assets } = useAssetStore();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const up = (patch: Partial<Shot>) => updateShot(shot.id, patch);

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
      await generateShotImage(shot.id);
    } finally {
      setIsGeneratingImage(false);
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
          onPreview={() => {
            if (!shot.mediaUrl) return;
            onPreviewMedia({
              url: shot.mediaUrl,
              title: `镜头 ${shot.shotNumber}`,
              kind: getMediaPreviewKind(shot.mediaUrl),
            });
          }}
          isGenerating={isGeneratingImage}
        />
      </td>

      <td className="w-24 border-r border-white/5 px-2 py-3">
        <Select
          value={shot.sceneType || ""}
          onValueChange={(v) => up({ sceneType: (v === "__clear__" ? "" : v) as typeof shot.sceneType })}
        >
          <SelectTrigger>
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
    generateShots,
    generateAllShotImages,
  } = useStoryboardStore();
  const initAssets = useAssetStore((s) => s.init);
  const [generateError, setGenerateError] = useState("");
  const [preview, setPreview] = useState<{ url: string; title: string; kind: MediaPreviewKind } | null>(null);

  useEffect(() => {
    if (!projectId) return;
    init(projectId);
    initAssets(projectId);
  }, [projectId, init, initAssets]);

  const handleGenerateShots = async () => {
    if (!projectId) return;
    setGenerateError("");
    try {
      await generateShots(projectId);
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "分镜生成失败");
    }
  };

  const handleGenerateAllShotImages = async () => {
    setGenerateError("");
    try {
      await generateAllShotImages();
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "批量生成分镜图失败");
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
            disabled={!projectId || shots.length === 0 || isLoading || isGeneratingAllImages}
            className="flex h-9 items-center gap-2 rounded-lg bg-white/8 px-4 text-xs font-medium text-white/70 transition-colors hover:bg-white/14 hover:text-white disabled:opacity-40"
          >
            <Images className="h-3.5 w-3.5" />
            {isGeneratingAllImages
              ? `生成 ${imageGenerationProgress.completed}/${imageGenerationProgress.total}`
              : "生成全部分镜图"}
          </button>
          <button
            onClick={() => { handleGenerateShots(); }}
            disabled={!projectId || isLoading || isGeneratingAllImages}
            className="flex h-9 items-center gap-2 rounded-lg bg-green-500/15 px-4 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/25 disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isLoading ? "生成中…" : "AI生成分镜"}
          </button>
        </div>
      </div>

      {generateError ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {generateError}
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
              <ShotRow key={shot.id} shot={shot} onPreviewMedia={setPreview} />
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
