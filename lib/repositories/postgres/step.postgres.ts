import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { projectSteps } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { IStepRepository, StepKey, UpdateStepInput } from "../interfaces/step.repository";
import type { StepRow } from "@/lib/db/types";

const ALL_STEP_KEYS: StepKey[] = ["script", "assets", "storyboard", "video"];

export class StepPostgresRepository implements IStepRepository {
  async findByProject(projectId: string): Promise<StepRow[]> {
    const rows = await db
      .select()
      .from(projectSteps)
      .where(eq(projectSteps.projectId, projectId));

    return rows.map((row) =>
      row.stepKey === "character" ? { ...row, stepKey: "assets" } : row
    );
  }

  async initForProject(projectId: string): Promise<StepRow[]> {
    const rows = await db
      .insert(projectSteps)
      .values(
        ALL_STEP_KEYS.map((key) => ({
          id: randomUUID(),
          projectId,
          stepKey: key,
          completed: false,
          content: "",
        }))
      )
      .onConflictDoNothing()
      .returning();

    // Some rows may have already existed — fetch all to return a complete set
    if (rows.length < ALL_STEP_KEYS.length) {
      return this.findByProject(projectId);
    }
    return rows;
  }

  async upsert(projectId: string, stepKey: StepKey, data: UpdateStepInput): Promise<StepRow> {
    const set: Record<string, unknown> = {};
    if (data.content !== undefined) set.content = data.content;
    if (data.completed !== undefined) set.completed = data.completed;

    const rows = await db
      .insert(projectSteps)
      .values({
        id: randomUUID(),
        projectId,
        stepKey,
        content: data.content ?? "",
        completed: data.completed ?? false,
      })
      .onConflictDoUpdate({
        target: [projectSteps.projectId, projectSteps.stepKey],
        set,
      })
      .returning();
    return rows[0];
  }
}
