import { NoOutputGeneratedError, generateText, Output } from "ai";
import { z } from "zod";
import type { CharacterRow } from "@/lib/db/types";
import { SCENE_TYPES } from "@/lib/storyboard/constants";
import { getStructuredOutputModel, getStructuredOutputTimeout } from "./model";
import {
  getCharacterExtractionSystemPrompt,
  getCharacterExtractionUserPrompt,
  getShotGenerationSystemPrompt,
  getShotGenerationUserPrompt,
} from "./prompts";
import { mergeDistinctText, normalizeName, splitScriptIntoChunks } from "./script-utils";

const generatedCharacterOutputSchema = z.object({
  name: z.string(),
  appearance: z.string(),
  description: z.string(),
  mediaUrl: z.string(),
});

const generatedShotDraftOutputSchema = z.object({
  sceneType: z.string().nullable(),
  characterName: z.string().nullable(),
  dialogue: z.string().nullable(),
  characterAction: z.string().nullable(),
  lightingMood: z.string().nullable(),
});

type GeneratedCharacterOutput = z.infer<typeof generatedCharacterOutputSchema>;
type GeneratedShotDraftOutput = z.infer<typeof generatedShotDraftOutputSchema>;
export type GeneratedCharacterRow = {
  name: string;
  appearance: string;
  description: string;
  mediaUrl: string;
};
type GeneratedShotDraft = {
  sceneType?: string | null;
  characterName?: string | null;
  dialogue?: string;
  characterAction?: string;
  lightingMood?: string;
};
export type GeneratedShotRow = {
  shotNumber: number;
  sceneType: (typeof SCENE_TYPES)[number] | "";
  characterId: string | null;
  dialogue: string;
  characterAction: string;
  lightingMood: string;
  mediaUrl: string;
};

const CHARACTER_NAME_MAX_LENGTH = 80;
const CHARACTER_APPEARANCE_MAX_LENGTH = 400;
const CHARACTER_DESCRIPTION_MAX_LENGTH = 1200;

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
    characterName: normalizeDraftText(draft.characterName) || null,
    dialogue: normalizeDraftText(draft.dialogue),
    characterAction: normalizeDraftText(draft.characterAction),
    lightingMood: normalizeDraftText(draft.lightingMood),
  };
}

function asOptionalText(value: unknown) {
  if (value == null || value === "") return undefined;
  return typeof value === "string" ? value : String(value);
}

function validateGeneratedCharacter(character: GeneratedCharacterOutput) {
  const name = normalizeDraftText(character.name);
  const appearance = normalizeDraftText(character.appearance);
  const description = normalizeDraftText(character.description);

  if (!name || !appearance || !description) return null;
  if (name.length > CHARACTER_NAME_MAX_LENGTH) return null;
  if (appearance.length > CHARACTER_APPEARANCE_MAX_LENGTH) return null;
  if (description.length > CHARACTER_DESCRIPTION_MAX_LENGTH) return null;

  return {
    name,
    appearance,
    description,
    mediaUrl: "",
  };
}

function validateGeneratedShotDraft(draft: GeneratedShotDraftOutput) {
  return normalizeShotDraft({
    sceneType: asOptionalText(draft.sceneType),
    characterName: asOptionalText(draft.characterName),
    dialogue: asOptionalText(draft.dialogue) ?? "",
    characterAction: asOptionalText(draft.characterAction) ?? "",
    lightingMood: asOptionalText(draft.lightingMood) ?? "",
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

function resolveCharacterIdByName(characterName: string | null, characters: CharacterRow[]) {
  if (!characterName) return null;

  const normalized = normalizeName(characterName);
  if (!normalized) return null;

  const exactMatch = characters.find((character) => normalizeName(character.name) === normalized);
  if (exactMatch) return exactMatch.id;

  const looseMatch = characters.find((character) => {
    const normalizedCharacterName = normalizeName(character.name);
    return (
      normalizedCharacterName.includes(normalized) ||
      normalized.includes(normalizedCharacterName)
    );
  });

  return looseMatch?.id ?? null;
}

async function generateStructuredShotDrafts(params: {
  chunk: string;
  index: number;
  total: number;
  characters: CharacterRow[];
}) {
  const result = await generateText({
    model: getStructuredOutputModel(),
    temperature: 0.2,
    timeout: getStructuredOutputTimeout(),
    system: getShotGenerationSystemPrompt(),
    output: Output.array({
      element: generatedShotDraftOutputSchema,
      name: "shots",
      description: "Storyboard shot drafts with sceneType, characterName, dialogue, characterAction, lightingMood.",
    }),
    prompt: getShotGenerationUserPrompt(params),
  });

  const drafts = result.output
    .map(validateGeneratedShotDraft)
    .filter((draft): draft is GeneratedShotDraft => draft !== null);

  if (drafts.length > 0) {
    return drafts;
  }

  const fallbackDrafts = parseShotDraftsFromText(result.text);
  if (fallbackDrafts.length > 0) {
    console.warn("[AI] Recovered storyboard drafts from raw text fallback", {
      chunkIndex: params.index,
      totalChunks: params.total,
      preview: result.text.slice(0, 800),
    });
    return fallbackDrafts;
  }

  console.error("[AI] Failed to validate structured storyboard output", {
    chunkIndex: params.index,
    totalChunks: params.total,
    preview: result.text.slice(0, 800),
  });

  throw new NoOutputGeneratedError({
    message: "No valid storyboard output could be parsed.",
  });
}

export async function extractCharactersFromScript(script: string): Promise<GeneratedCharacterRow[]> {
  const chunks = splitScriptIntoChunks(script);
  const deduped = new Map<string, GeneratedCharacterRow>();

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const { output } = await generateText({
      model: getStructuredOutputModel(),
      temperature: 0.2,
      timeout: getStructuredOutputTimeout(),
      system: getCharacterExtractionSystemPrompt(),
      output: Output.array({
        element: generatedCharacterOutputSchema,
        name: "characters",
        description: "Character rows matching the database fields name, appearance, description, mediaUrl.",
      }),
      prompt: getCharacterExtractionUserPrompt(chunk, index, chunks.length),
    });

    for (const rawCharacter of output) {
      const character = validateGeneratedCharacter(rawCharacter);
      if (!character) continue;

      const key = normalizeName(character.name);
      const existing = deduped.get(key);

      if (!existing) {
        deduped.set(key, character);
        continue;
      }

      deduped.set(key, {
        name: existing.name,
        appearance: mergeDistinctText(existing.appearance, character.appearance),
        description: mergeDistinctText(existing.description, character.description),
        mediaUrl: "",
      });
    }
  }

  return [...deduped.values()];
}

export async function generateShotsFromScript(
  script: string,
  characters: CharacterRow[]
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
      characters,
    });

    for (let shotIndex = 0; shotIndex < drafts.length; shotIndex += 1) {
      const shot = drafts[shotIndex];
      generatedShots.push({
        shotNumber: startShotNumber + shotIndex,
        sceneType: normalizeSceneType(shot.sceneType),
        characterId: resolveCharacterIdByName(shot.characterName ?? null, characters),
        dialogue: normalizeDraftText(shot.dialogue),
        characterAction: normalizeDraftText(shot.characterAction),
        lightingMood: normalizeDraftText(shot.lightingMood),
        mediaUrl: "",
      });
    }
  }

  return generatedShots;
}
