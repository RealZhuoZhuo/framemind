import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { projectAssets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type {
  IAssetRepository,
  CreateAssetInput,
  UpdateAssetInput,
} from "../interfaces/asset.repository";
import type { AssetRow } from "@/lib/db/types";

export class AssetPostgresRepository implements IAssetRepository {
  async findByProject(projectId: string): Promise<AssetRow[]> {
    return db
      .select()
      .from(projectAssets)
      .where(eq(projectAssets.projectId, projectId))
      .orderBy(projectAssets.type, projectAssets.name) as Promise<AssetRow[]>;
  }

  async findById(id: string): Promise<AssetRow | null> {
    const rows = await db.select().from(projectAssets).where(eq(projectAssets.id, id));
    return (rows[0] as AssetRow | undefined) ?? null;
  }

  async create(projectId: string, data: CreateAssetInput): Promise<AssetRow> {
    const rows = await db
      .insert(projectAssets)
      .values({
        id: randomUUID(),
        projectId,
        type: data.type,
        name: data.name,
        appearance: data.appearance ?? "",
        description: data.description ?? "",
        mediaUrl: data.mediaUrl ?? null,
      })
      .returning();
    return rows[0] as AssetRow;
  }

  async update(id: string, data: UpdateAssetInput): Promise<AssetRow | null> {
    const rows = await db
      .update(projectAssets)
      .set(data)
      .where(eq(projectAssets.id, id))
      .returning();
    return (rows[0] as AssetRow | undefined) ?? null;
  }

  async delete(id: string): Promise<void> {
    await db.delete(projectAssets).where(eq(projectAssets.id, id));
  }

  async deleteByProject(projectId: string): Promise<void> {
    await db.delete(projectAssets).where(eq(projectAssets.projectId, projectId));
  }
}
