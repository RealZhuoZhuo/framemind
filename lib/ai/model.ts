import { createOpenAI, openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export function getStructuredOutputModel(): LanguageModel {
  if (process.env.OPENAI_API_KEY) {
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
    const baseURL = process.env.OPENAI_BASE_URL?.trim();

    if (baseURL) {
      const provider = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL,
      });
      return provider(model);
    }

    return openai(model);
  }

  const configuredModel = process.env.AI_MODEL?.trim();
  if (configuredModel) return configuredModel;

  throw new Error("Missing AI model configuration. Set OPENAI_API_KEY or AI_MODEL.");
}
