"use client";

import { useEffect, useRef, useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { Box, Building2, Images, MoreHorizontal, Pencil, Plus, Sparkles, Trash2, UserCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssetStore, type Asset, type AssetType } from "@/store/useAssetStore";
import { MediaPreviewModal } from "@/components/project/MediaPreviewModal";

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  character: "角色",
  scene: "场景",
  prop: "道具",
};

const ASSET_TYPE_OPTIONS: Array<{ value: AssetType; label: string }> = [
  { value: "character", label: "角色" },
  { value: "scene", label: "场景" },
  { value: "prop", label: "道具" },
];

type AssetFilter = "all" | AssetType;
type EditFields = Pick<Asset, "type" | "name" | "appearance" | "description">;

function AssetIcon({ type, className }: { type: AssetType; className?: string }) {
  if (type === "scene") return <Building2 className={className} />;
  if (type === "prop") return <Box className={className} />;
  return <UserCircle2 className={className} />;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-white/40">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-white/20 focus:border-green-500/40 focus:outline-none transition-colors";
const textareaCls =
  "w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-green-500/40 focus:outline-none transition-colors leading-relaxed";

function EditAssetModal({
  initial,
  mediaUrl,
  onClose,
  onSave,
  onGenerateImage,
  onPreviewImage,
}: {
  initial: EditFields;
  mediaUrl?: string | null;
  onClose: () => void;
  onSave: (data: EditFields) => void | Promise<void>;
  onGenerateImage?: (data: EditFields) => void | Promise<void>;
  onPreviewImage?: () => void;
}) {
  const [form, setForm] = useState<EditFields>(initial);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
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

  const handleGenerateImage = async () => {
    if (!onGenerateImage) return;
    setImageLoading(true);
    setErrorMessage("");
    try {
      await onGenerateImage(form);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "参考图生成失败");
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex w-[780px] max-h-[88vh] overflow-hidden rounded-xl border border-white/10 bg-[#161616] shadow-2xl">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/8 bg-[#161616] px-7 py-4">
          <h2 className="text-sm font-semibold text-white">资产编辑</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 hover:bg-white/8 hover:text-white/60">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex w-full pt-[57px] pb-[61px] overflow-hidden">
          <div className="relative flex w-1/2 shrink-0 flex-col items-center justify-center border-r border-white/8 bg-[#111]">
            {mediaUrl ? (
              <button
                type="button"
                onClick={onPreviewImage}
                className="h-full w-full cursor-zoom-in"
                aria-label="预览资产参考图"
              >
                <img src={mediaUrl} alt={initial.name || "资产参考图"} className="h-full w-full object-contain" />
              </button>
            ) : (
              <>
                <AssetIcon type={form.type} className="h-24 w-24 text-white/10" />
                <span className="mt-3 text-[11px] text-white/25">请生成资产参考图</span>
              </>
            )}
            <button
              disabled={!onGenerateImage || imageLoading}
              onClick={() => { handleGenerateImage(); }}
              className="absolute bottom-6 rounded-lg bg-white/8 px-5 py-2 text-xs text-white/70 backdrop-blur hover:bg-white/14 hover:text-white disabled:opacity-40 transition-colors"
            >
              {imageLoading ? "生成中…" : "生成参考图"}
            </button>
          </div>

          <div className="flex w-1/2 flex-col gap-4 overflow-y-auto px-7 py-6">
            <Field label="类型">
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputCls}>
                {ASSET_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#161616]">
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="名称">
              <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
            </Field>
            <Field label="视觉描述">
              <textarea rows={3} value={form.appearance} onChange={(e) => set("appearance", e.target.value)} className={textareaCls} />
            </Field>
            <Field label="详细设定">
              <textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} className={textareaCls} />
            </Field>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex justify-end gap-3 border-t border-white/8 bg-[#161616] px-7 py-4">
          {errorMessage ? <div className="mr-auto rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">{errorMessage}</div> : null}
          <button onClick={onClose} className="h-9 rounded-lg px-5 text-sm text-white/40 hover:text-white/60">取消</button>
          <button disabled={loading} onClick={() => { handleSave(); }} className="h-9 rounded-lg bg-green-500 px-6 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-40">
            {loading ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssetCard({
  asset,
  onEdit,
  onDelete,
  onPreview,
}: {
  asset: Asset;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className={cn("relative flex flex-col overflow-hidden rounded-lg border-2 bg-[#111] transition-all duration-200 hover:shadow-lg hover:shadow-black/40", asset.borderColor)}>
      <div ref={menuRef} className="absolute right-2.5 top-2.5 z-10">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-white/20 bg-black/70 text-white/85 shadow-lg shadow-black/40 backdrop-blur transition-colors hover:border-green-400/50 hover:bg-black/85 hover:text-green-200"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen ? (
          <div className="absolute right-0 top-8 min-w-[130px] rounded-xl border border-white/10 bg-[#1e1e1e] py-1 shadow-xl">
            <button onClick={() => { setMenuOpen(false); onEdit(); }} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-white/60 hover:bg-white/6 hover:text-white">
              <Pencil className="h-3.5 w-3.5" /> 编辑资产
            </button>
            <div className="my-1 border-t border-white/8" />
            <button onClick={() => { setMenuOpen(false); onDelete(); }} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-red-400/80 hover:bg-red-500/8 hover:text-red-400">
              <Trash2 className="h-3.5 w-3.5" /> 删除
            </button>
          </div>
        ) : null}
      </div>

      <div className={cn("relative flex h-56 items-center justify-center bg-gradient-to-b", asset.gradientFrom, "to-[#111]")}>
        {asset.mediaUrl ? (
          <button type="button" onClick={onPreview} className="h-full w-full cursor-zoom-in" aria-label={`预览${asset.name}`}>
            <img src={asset.mediaUrl} alt={asset.name} className="h-full w-full object-contain" />
          </button>
        ) : (
          <AssetIcon type={asset.type} className="h-20 w-20 text-white/10" />
        )}
      </div>

      <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
        <div className="flex items-center justify-center gap-2">
          <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/45">{ASSET_TYPE_LABELS[asset.type]}</span>
          <h3 className="truncate text-center text-sm font-bold text-white">{asset.name}</h3>
        </div>
        <p className="line-clamp-3 min-h-[54px] text-xs leading-relaxed text-white/60">{asset.description}</p>
      </div>
    </div>
  );
}

function AddCard({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-white/10 bg-[#111] transition-all hover:border-green-500/40 hover:bg-green-500/5">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 group-hover:border-green-500/40 group-hover:bg-green-500/10">
        <Plus className="h-5 w-5 text-white/30 group-hover:text-green-400" />
      </div>
      <span className="text-xs text-white/30 group-hover:text-white/60">添加资产</span>
    </button>
  );
}

export default function AssetManagement() {
  const projectId = useProjectStore((s) => s.projectId);
  const {
    assets,
    isLoading,
    isGeneratingAllImages,
    imageGenerationProgress,
    init,
    addAsset,
    updateAsset,
    removeAsset,
    generateAssets,
    generateAssetImage,
    generateAllAssetImages,
  } = useAssetStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [generateError, setGenerateError] = useState("");
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (projectId) init(projectId);
  }, [projectId, init]);

  const editingAsset = assets.find((asset) => asset.id === editingId) ?? null;
  const visibleAssets = filter === "all" ? assets : assets.filter((asset) => asset.type === filter);

  const handleGenerateAssets = async () => {
    if (!projectId) return;
    setGenerateError("");
    try {
      await generateAssets(projectId);
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "资产提取失败");
    }
  };

  const handleGenerateAllAssetImages = async () => {
    setGenerateError("");
    try {
      await generateAllAssetImages();
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "批量生成参考图失败");
    }
  };

  if (isLoading && assets.length === 0) {
    return <div className="flex h-40 items-center justify-center"><span className="text-sm text-white/30">加载中…</span></div>;
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/[0.03] p-1">
          {([{ value: "all", label: "全部" }, ...ASSET_TYPE_OPTIONS] as Array<{ value: AssetFilter; label: string }>).map((option) => (
            <button key={option.value} onClick={() => setFilter(option.value)} className={cn("h-7 rounded-md px-3 text-xs transition-colors", filter === option.value ? "bg-green-500/20 text-green-300" : "text-white/40 hover:bg-white/6 hover:text-white/70")}>
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { handleGenerateAllAssetImages(); }}
            disabled={!projectId || assets.length === 0 || isLoading || isGeneratingAllImages}
            className="flex h-9 items-center gap-2 rounded-lg bg-white/8 px-4 text-xs font-medium text-white/70 transition-colors hover:bg-white/14 hover:text-white disabled:opacity-40"
          >
            <Images className="h-3.5 w-3.5" />
            {isGeneratingAllImages
              ? `生成 ${imageGenerationProgress.completed}/${imageGenerationProgress.total}`
              : "生成全部参考图"}
          </button>
          <button onClick={() => { handleGenerateAssets(); }} disabled={!projectId || isLoading || isGeneratingAllImages} className="flex h-9 items-center gap-2 rounded-lg bg-green-500/15 px-4 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/25 disabled:opacity-40">
            <Sparkles className="h-3.5 w-3.5" />
            {isLoading ? "提取中…" : "AI提取资产"}
          </button>
        </div>
      </div>

      {generateError ? <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{generateError}</div> : null}

      <div className="grid grid-cols-4 gap-4">
        {visibleAssets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            onEdit={() => setEditingId(asset.id)}
            onDelete={() => removeAsset(asset.id)}
            onPreview={() => {
              if (asset.mediaUrl) setPreview({ url: asset.mediaUrl, title: asset.name });
            }}
          />
        ))}
        <AddCard onClick={() => setAdding(true)} />
      </div>

      {adding ? (
        <EditAssetModal
          initial={{ type: "character", name: "", appearance: "", description: "" }}
          mediaUrl={null}
          onClose={() => setAdding(false)}
          onSave={async (data) => {
            if (projectId) await addAsset(projectId, data);
            setAdding(false);
          }}
        />
      ) : null}

      {editingAsset ? (
        <EditAssetModal
          initial={{
            type: editingAsset.type,
            name: editingAsset.name,
            appearance: editingAsset.appearance,
            description: editingAsset.description,
          }}
          mediaUrl={editingAsset.mediaUrl}
          onClose={() => setEditingId(null)}
          onSave={(data) => updateAsset(editingAsset.id, data)}
          onPreviewImage={() => {
            if (editingAsset.mediaUrl) setPreview({ url: editingAsset.mediaUrl, title: editingAsset.name });
          }}
          onGenerateImage={async (data) => {
            await updateAsset(editingAsset.id, data);
            await generateAssetImage(editingAsset.id);
          }}
        />
      ) : null}

      <MediaPreviewModal
        open={Boolean(preview)}
        url={preview?.url ?? null}
        title={preview?.title}
        kind="image"
        onClose={() => setPreview(null)}
      />
    </>
  );
}
