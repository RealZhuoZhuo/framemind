import type { StepRow } from "@/lib/db/types";

export type StepKey = "script" | "assets" | "storyboard" | "video";

export interface IStepRepository {
  findByProject(projectId: string): Promise<StepRow[]>;
  upsert(projectId: string, stepKey: StepKey, data: UpdateStepInput): Promise<StepRow>;
  initForProject(projectId: string): Promise<StepRow[]>;
}

export type UpdateStepInput = Partial<{
  content: string;
  completed: boolean;
}>;
