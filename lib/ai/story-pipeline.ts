import { NoOutputGeneratedError, generateText, Output } from "ai";
import { z } from "zod";
import type { AssetRow, AssetType } from "@/lib/db/types";
import { SCENE_TYPES } from "@/lib/storyboard/constants";
import { getStructuredOutputModel, getStructuredOutputTimeout } from "./model";
import {
  getAssetExtractionSystemPrompt,
  getAssetExtractionUserPrompt,
  getShotGenerationSystemPrompt,
  getShotGenerationUserPrompt,
} from "./prompts";
import { mergeDistinctText, normalizeName, splitScriptIntoChunks } from "./script-utils";

const generatedAssetOutputSchema = z.object({
  type: z.enum(["character", "scene", "prop"]),
  name: z.string(),
  appearance: z.string(),
  description: z.string(),
  mediaUrl: z.string(),
});

type GeneratedAssetOutput = z.infer<typeof generatedAssetOutputSchema>;
type GeneratedShotDraftOutput = Record<string, unknown>;
export type GeneratedAssetRow = {
  type: AssetType;
  name: string;
  appearance: string;
  description: string;
  mediaUrl: string;
};
type GeneratedShotDraft = {
  sceneType?: string | null;
  assetNames?: string[];
  shotDescription?: string;
  dialogueSpeaker?: string;
  dialogue?: string;
  characterAction?: string;
  lightingMood?: string;
};
export type GeneratedShotRow = {
  shotNumber: number;
  sceneType: (typeof SCENE_TYPES)[number] | "";
  assetIds: string[];
  shotDescription: string;
  dialogueSpeaker: string;
  dialogue: string;
  characterAction: string;
  lightingMood: string;
  mediaUrl: string;
};

const ASSET_NAME_MAX_LENGTH = 100;
const ASSET_APPEARANCE_MAX_LENGTH = 600;
const ASSET_DESCRIPTION_MAX_LENGTH = 1600;

function normalizeDraftText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeSceneType(sceneType: string | null | undefined): GeneratedShotRow["sceneType"] {
  const value = normalizeDraftText(sceneType);
  if (!value) return "";

  if (SCENE_TYPES.includes(value as (typeof SCENE_TYPES)[number])) {
    return value as GeneratedShotRow["sceneType"];
  }

  const matched = SCENE_TYPES.find((candidate) => value.includes(candidate));
  return matched ?? "";
}

function normalizeShotDraft(draft: GeneratedShotDraft): GeneratedShotDraft {
  return {
    sceneType: normalizeDraftText(draft.sceneType),
    assetNames: [...new Set((draft.assetNames ?? []).map(normalizeDraftText).filter(Boolean))],
    shotDescription: normalizeDraftText(draft.shotDescription),
    dialogueSpeaker: normalizeDraftText(draft.dialogueSpeaker),
    dialogue: normalizeDraftText(draft.dialogue),
    characterAction: normalizeDraftText(draft.characterAction),
    lightingMood: normalizeDraftText(draft.lightingMood),
  };
}

function asOptionalText(value: unknown) {
  if (value == null || value === "") return undefined;
  if (typeof value === "object") return undefined;
  return typeof value === "string" ? value : String(value);
}

function asTextArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          return asOptionalText(record.name) ?? asOptionalText(record.assetName) ?? [];
        }
        return asOptionalText(item) ?? [];
      })
      .filter((item): item is string => Boolean(item));
  }

  const text = asOptionalText(value);
  if (!text) return [];

  return text
    .split(/[、,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readShotAssetNames(draft: GeneratedShotDraftOutput) {
  const directNames = asTextArray(draft.assetNames);
  if (directNames.length > 0) return directNames;

  const fallbackNames = asTextArray(draft.assets);
  if (fallbackNames.length > 0) return fallbackNames;

  return asTextArray(draft.assetName);
}

function hasShotContent(draft: GeneratedShotDraft) {
  return Boolean(
    normalizeDraftText(draft.sceneType) ||
      (draft.assetNames?.length ?? 0) > 0 ||
      normalizeDraftText(draft.shotDescription) ||
      normalizeDraftText(draft.dialogueSpeaker) ||
      normalizeDraftText(draft.dialogue) ||
      normalizeDraftText(draft.characterAction) ||
      normalizeDraftText(draft.lightingMood)
  );
}

function validateGeneratedAsset(asset: GeneratedAssetOutput) {
  const type = asset.type;
  const name = normalizeDraftText(asset.name);
  const appearance = normalizeDraftText(asset.appearance);
  const description = normalizeDraftText(asset.description);

  if (!name || !appearance || !description) return null;
  if (name.length > ASSET_NAME_MAX_LENGTH) return null;
  if (appearance.length > ASSET_APPEARANCE_MAX_LENGTH) return null;
  if (description.length > ASSET_DESCRIPTION_MAX_LENGTH) return null;

  return {
    type,
    name,
    appearance,
    description,
    mediaUrl: "",
  };
}

function validateGeneratedShotDraft(draft: GeneratedShotDraftOutput) {
  return normalizeShotDraft({
    sceneType: asOptionalText(draft.sceneType),
    assetNames: readShotAssetNames(draft),
    shotDescription:
      asOptionalText(draft.shotDescription) ??
      asOptionalText(draft.shot_description) ??
      asOptionalText(draft.description) ??
      "",
    dialogue: asOptionalText(draft.dialogue) ?? "",
    dialogueSpeaker:
      asOptionalText(draft.dialogueSpeaker) ??
      asOptionalText(draft.dialogue_speaker) ??
      asOptionalText(draft.speaker) ??
      "",
    characterAction:
      asOptionalText(draft.characterAction) ??
      asOptionalText(draft.character_action) ??
      asOptionalText(draft.action) ??
      "",
    lightingMood:
      asOptionalText(draft.lightingMood) ??
      asOptionalText(draft.lighting_mood) ??
      asOptionalText(draft.mood) ??
      "",
  });
}

function extractJsonCandidates(text: string) {
  const candidates = new Set<string>();
  const trimmed = text.trim();

  if (trimmed) {
    candidates.add(trimmed);
  }

  for (const match of text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) {
    const candidate = match[1]?.trim();
    if (candidate) candidates.add(candidate);
  }

  const arrayStart = text.indexOf("[");
  const arrayEnd = text.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    candidates.add(text.slice(arrayStart, arrayEnd + 1).trim());
  }

  const objectStart = text.indexOf("{");
  const objectEnd = text.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    candidates.add(text.slice(objectStart, objectEnd + 1).trim());
  }

  return [...candidates];
}

function coerceShotDraftArray(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.shots)) return record.shots;
    if (Array.isArray(record.elements)) return record.elements;
    if (Array.isArray(record.data)) return record.data;
    if (
      "sceneType" in record ||
      "shotDescription" in record ||
      "dialogue" in record ||
      "characterAction" in record
    ) {
      return [record];
    }
  }

  return null;
}

function parseShotDraftsFromText(text: string) {
  for (const candidate of extractJsonCandidates(text)) {
    try {
      const parsed = JSON.parse(candidate);
      const rawDrafts = coerceShotDraftArray(parsed);
      if (!rawDrafts) continue;

      const drafts: GeneratedShotDraft[] = [];
      for (const rawDraft of rawDrafts) {
        if (!rawDraft || typeof rawDraft !== "object") continue;

        const draft = validateGeneratedShotDraft(rawDraft as GeneratedShotDraftOutput);
        if (!hasShotContent(draft)) continue;
        drafts.push(draft);
      }

      if (drafts.length > 0) {
        return drafts;
      }
    } catch {
      continue;
    }
  }

  return [];
}

function resolveAssetIdsByNames(assetNames: string[], assets: AssetRow[]) {
  const resolved = new Set<string>();

  for (const assetName of assetNames) {
    const normalized = normalizeName(assetName);
    if (!normalized) continue;

    const exactMatch = assets.find((asset) => normalizeName(asset.name) === normalized);
    if (exactMatch) {
      resolved.add(exactMatch.id);
      continue;
    }

    const looseMatch = assets.find((asset) => {
      const normalizedAssetName = normalizeName(asset.name);
      if (!normalizedAssetName) return false;
      return normalizedAssetName.includes(normalized) || normalized.includes(normalizedAssetName);
    });
    if (looseMatch) resolved.add(looseMatch.id);
  }

  return [...resolved];
}

function makeAssetKey(asset: Pick<AssetRow, "type" | "name">) {
  return `${asset.type}:${normalizeName(asset.name)}`;
}

async function generateStructuredShotDrafts(params: {
  chunk: string;
  index: number;
  total: number;
  assets: AssetRow[];
}) {
  const result = await generateText({
    model: getStructuredOutputModel(),
    temperature: 0.2,
    timeout: getStructuredOutputTimeout(),
    system: getShotGenerationSystemPrompt(),
    prompt: getShotGenerationUserPrompt(params),
  });

  const drafts = parseShotDraftsFromText(result.text);
  if (drafts.length > 0) {
    return drafts;
  }

  console.error("[AI] Failed to parse storyboard JSON output", {
    chunkIndex: params.index,
    totalChunks: params.total,
    preview: result.text.slice(0, 800),
  });

  throw new NoOutputGeneratedError({
    message: "No valid storyboard output could be parsed.",
  });
}

export async function extractAssetsFromScript(script: string): Promise<GeneratedAssetRow[]> {
  const chunks = splitScriptIntoChunks(script);
  const deduped = new Map<string, GeneratedAssetRow>();

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const { output } = await generateText({
      model: getStructuredOutputModel(),
      temperature: 0.2,
      timeout: getStructuredOutputTimeout(),
      system: getAssetExtractionSystemPrompt(),
      output: Output.array({
        element: generatedAssetOutputSchema,
        name: "assets",
        description: "Project assets matching type, name, appearance, description, mediaUrl.",
      }),
      prompt: getAssetExtractionUserPrompt(chunk, index, chunks.length),
    });

    for (const rawAsset of output) {
      const asset = validateGeneratedAsset(rawAsset);
      if (!asset) continue;

      const key = makeAssetKey(asset);
      const existing = deduped.get(key);

      if (!existing) {
        deduped.set(key, asset);
        continue;
      }

      deduped.set(key, {
        type: existing.type,
        name: existing.name,
        appearance: mergeDistinctText(existing.appearance, asset.appearance),
        description: mergeDistinctText(existing.description, asset.description),
        mediaUrl: "",
      });
    }
  }

  return [...deduped.values()];
}

export async function generateShotsFromScript(
  script: string,
  assets: AssetRow[]
): Promise<GeneratedShotRow[]> {
  const chunks = splitScriptIntoChunks(script, 5000);
  const generatedShots: GeneratedShotRow[] = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const startShotNumber = generatedShots.length + 1;
    const drafts = await generateStructuredShotDrafts({
      chunk,
      index,
      total: chunks.length,
      assets,
    });

    for (let shotIndex = 0; shotIndex < drafts.length; shotIndex += 1) {
      const shot = drafts[shotIndex];
      generatedShots.push({
        shotNumber: startShotNumber + shotIndex,
        sceneType: normalizeSceneType(shot.sceneType),
        assetIds: resolveAssetIdsByNames(shot.assetNames ?? [], assets),
        shotDescription: normalizeDraftText(shot.shotDescription),
        dialogueSpeaker: normalizeDraftText(shot.dialogueSpeaker),
        dialogue: normalizeDraftText(shot.dialogue),
        characterAction: normalizeDraftText(shot.characterAction),
        lightingMood: normalizeDraftText(shot.lightingMood),
        mediaUrl: "",
      });
    }
  }

  return generatedShots;
}
