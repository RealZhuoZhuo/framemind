import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { projects, projectSteps, characters, shots, videoClips } from "./schema";

export type ProjectRow = InferSelectModel<typeof projects>;
export type ProjectInsert = InferInsertModel<typeof projects>;

export type StepRow = InferSelectModel<typeof projectSteps>;
export type StepInsert = InferInsertModel<typeof projectSteps>;

export type CharacterRow = InferSelectModel<typeof characters>;
export type CharacterInsert = InferInsertModel<typeof characters>;

export type ShotRow = InferSelectModel<typeof shots>;
export type ShotInsert = InferInsertModel<typeof shots>;

export type VideoClipRow = InferSelectModel<typeof videoClips>;
export type VideoClipInsert = InferInsertModel<typeof videoClips>;
