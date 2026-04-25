import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { projectAssets, shotAssets, shots } from "@/lib/db/schema";
import { eq, inArray, max } from "drizzle-orm";
import type {
  IShotRepository,
  CreateShotInput,
  UpdateShotInput,
} from "../interfaces/shot.repository";
import type { AssetRow, ShotRow, ShotWithAssets } from "@/lib/db/types";

export class ShotPostgresRepository implements IShotRepository {
  async findByProject(projectId: string): Promise<ShotWithAssets[]> {
    const rows = await db
      .select()
      .from(shots)
      .where(eq(shots.projectId, projectId))
      .orderBy(shots.shotNumber);
    return this.attachAssets(rows);
  }

  async findById(id: string): Promise<ShotWithAssets | null> {
    const rows = await db.select().from(shots).where(eq(shots.id, id));
    const shot = rows[0] ?? null;
    if (!shot) return null;
    const withAssets = await this.attachAssets([shot]);
    return withAssets[0] ?? null;
  }

  async create(projectId: string, data: CreateShotInput): Promise<ShotWithAssets> {
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
        id: randomUUID(),
        projectId,
        shotNumber,
        sceneType: data.sceneType ?? "",
        shotDescription: data.shotDescription ?? "",
        dialogueSpeaker: data.dialogueSpeaker ?? "",
        dialogue: data.dialogue ?? "",
        characterAction: data.characterAction ?? "",
        lightingMood: data.lightingMood ?? "",
        mediaUrl: data.mediaUrl ?? null,
      })
      .returning();
    const shot = rows[0];
    if (data.assetIds) {
      await this.setAssets(shot.id, data.assetIds);
    }
    const withAssets = await this.attachAssets([shot]);
    return withAssets[0];
  }

  async update(id: string, data: UpdateShotInput): Promise<ShotWithAssets | null> {
    const rows = await db
      .update(shots)
      .set(data)
      .where(eq(shots.id, id))
      .returning();
    const shot = rows[0] ?? null;
    if (!shot) return null;
    const withAssets = await this.attachAssets([shot]);
    return withAssets[0] ?? null;
  }

  async delete(id: string): Promise<void> {
    await db.delete(shots).where(eq(shots.id, id));
  }

  async deleteByProject(projectId: string): Promise<void> {
    await db.delete(shots).where(eq(shots.projectId, projectId));
  }

  async setAssets(shotId: string, assetIds: string[]): Promise<void> {
    await db.delete(shotAssets).where(eq(shotAssets.shotId, shotId));

    const uniqueAssetIds = [...new Set(assetIds.filter(Boolean))];
    if (uniqueAssetIds.length === 0) return;

    await db.insert(shotAssets).values(
      uniqueAssetIds.map((assetId) => ({
        shotId,
        assetId,
      }))
    );
  }

  async findAssetsByShot(shotId: string): Promise<AssetRow[]> {
    const rows = await db
      .select({ asset: projectAssets })
      .from(shotAssets)
      .innerJoin(projectAssets, eq(shotAssets.assetId, projectAssets.id))
      .where(eq(shotAssets.shotId, shotId));
    return rows.map((row) => row.asset as AssetRow);
  }

  private async attachAssets(rows: ShotRow[]): Promise<ShotWithAssets[]> {
    if (rows.length === 0) return [];

    const shotIds = rows.map((shot) => shot.id);
    const joined = await db
      .select({ shotId: shotAssets.shotId, asset: projectAssets })
      .from(shotAssets)
      .innerJoin(projectAssets, eq(shotAssets.assetId, projectAssets.id))
      .where(inArray(shotAssets.shotId, shotIds));

    const byShot = new Map<string, AssetRow[]>();
    for (const row of joined) {
      const list = byShot.get(row.shotId) ?? [];
      list.push(row.asset as AssetRow);
      byShot.set(row.shotId, list);
    }

    return rows.map((shot) => {
      const assets = byShot.get(shot.id) ?? [];
      return {
        ...shot,
        assetIds: assets.map((asset) => asset.id),
        assets,
      };
    });
  }
}
