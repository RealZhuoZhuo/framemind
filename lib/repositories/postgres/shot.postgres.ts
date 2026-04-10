import { db } from "@/lib/db";
import { shots } from "@/lib/db/schema";
import { eq, max } from "drizzle-orm";
import type {
  IShotRepository,
  CreateShotInput,
  UpdateShotInput,
} from "../interfaces/shot.repository";
import type { ShotRow } from "@/lib/db/types";

export class ShotPostgresRepository implements IShotRepository {
  async findByProject(projectId: string): Promise<ShotRow[]> {
    return db
      .select()
      .from(shots)
      .where(eq(shots.projectId, projectId))
      .orderBy(shots.shotNumber);
  }

  async findById(id: string): Promise<ShotRow | null> {
    const rows = await db.select().from(shots).where(eq(shots.id, id));
    return rows[0] ?? null;
  }

  async create(projectId: string, data: CreateShotInput): Promise<ShotRow> {
    let shotNumber = data.shotNumber;
    if (shotNumber === undefined) {
      const [row] = await db
        .select({ maxNum: max(shots.shotNumber) })
        .from(shots)
        .where(eq(shots.projectId, projectId));
      shotNumber = (row?.maxNum ?? 0) + 1;
    }
    const rows = await db
      .insert(shots)
      .values({
        projectId,
        shotNumber,
        description: data.description ?? "",
        sceneType: data.sceneType ?? "",
        cameraAngle: data.cameraAngle ?? "",
        narration: data.narration ?? "",
        characterId: data.characterId ?? null,
        dialogue: data.dialogue ?? "",
        notes: data.notes ?? "",
      })
      .returning();
    return rows[0];
  }

  async update(id: string, data: UpdateShotInput): Promise<ShotRow | null> {
    const rows = await db
      .update(shots)
      .set(data)
      .where(eq(shots.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async delete(id: string): Promise<void> {
    await db.delete(shots).where(eq(shots.id, id));
  }
}
