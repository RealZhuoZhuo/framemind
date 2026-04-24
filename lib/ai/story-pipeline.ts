import { generateText, Output } from "ai";
import { z } from "zod";
import type { CharacterRow } from "@/lib/db/types";
import { SCENE_TYPES } from "@/lib/storyboard/constants";
import { getStructuredOutputModel } from "./model";
import {
  getCharacterExtractionSystemPrompt,
  getCharacterExtractionUserPrompt,
  getShotGenerationSystemPrompt,
  getShotGenerationUserPrompt,
} from "./prompts";
import { mergeDistinctText, normalizeName, splitScriptIntoChunks } from "./script-utils";

const generatedCharacterSchema = z.object({
  name: z.string().min(1).max(80),
  appearance: z.string().min(1).max(400),
  description: z.string().min(1).max(1200),
  mediaUrl: z.string(),
});

const generatedShotSchema = z.object({
  shotNumber: z.number().int().positive(),
  sceneType: z.enum(SCENE_TYPES).or(z.literal("")),
  characterId: z.string().nullable(),
  dialogue: z.string(),
  characterAction: z.string(),
  lightingMood: z.string(),
  mediaUrl: z.string(),
});

export type GeneratedCharacterRow = z.infer<typeof generatedCharacterSchema>;
export type GeneratedShotRow = z.infer<typeof generatedShotSchema>;

export async function extractCharactersFromScript(script: string): Promise<GeneratedCharacterRow[]> {
  const chunks = splitScriptIntoChunks(script);
  const deduped = new Map<string, GeneratedCharacterRow>();

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const { output } = await generateText({
      model: getStructuredOutputModel(),
      temperature: 0.2,
      system: getCharacterExtractionSystemPrompt(),
      output: Output.array({
        element: generatedCharacterSchema,
        name: "characters",
        description: "Character rows matching the database fields name, appearance, description, mediaUrl.",
      }),
      prompt: getCharacterExtractionUserPrompt(chunk, index, chunks.length),
    });

    for (const character of output) {
      const key = normalizeName(character.name);
      const existing = deduped.get(key);

      if (!existing) {
        deduped.set(key, {
          ...character,
          mediaUrl: "",
        });
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
  const chunks = splitScriptIntoChunks(script, 7000);
  const validCharacterIds = new Set(characters.map((character) => character.id));
  const generatedShots: GeneratedShotRow[] = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const startShotNumber = generatedShots.length + 1;

    const { output } = await generateText({
      model: getStructuredOutputModel(),
      temperature: 0.2,
      system: getShotGenerationSystemPrompt(),
      output: Output.array({
        element: generatedShotSchema,
        name: "shots",
        description: "Storyboard shot rows matching the database fields shotNumber, sceneType, characterId, dialogue, characterAction, lightingMood, mediaUrl.",
      }),
      prompt: getShotGenerationUserPrompt({
        chunk,
        index,
        total: chunks.length,
        startShotNumber,
        characters,
      }),
    });

    for (let shotIndex = 0; shotIndex < output.length; shotIndex += 1) {
      const shot = output[shotIndex];
      generatedShots.push({
        shotNumber: startShotNumber + shotIndex,
        sceneType: shot.sceneType,
        characterId: shot.characterId && validCharacterIds.has(shot.characterId) ? shot.characterId : null,
        dialogue: shot.dialogue.trim(),
        characterAction: shot.characterAction.trim(),
        lightingMood: shot.lightingMood.trim(),
        mediaUrl: "",
      });
    }
  }

  return generatedShots;
}
