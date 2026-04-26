import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { projectAssets, shotAssets, shotDialogueSpeakers, shots } from "@/lib/db/schema";
import { and, eq, inArray, max } from "drizzle-orm";
import type {
  IShotRepository,
  CreateShotInput,
  UpdateShotInput,
} from "../interfaces/shot.repository";
import type { AssetRow, ShotRow, ShotWithAssets } from "@/lib/db/types";

function normalizeAssetName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "");
}

function splitDialogueSpeakerNames(value: string | null | undefined) {
  return [
    ...new Set(
      (value ?? "")
        .split(/[、,，]/)
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ];
}

function uniqueAssets(assets: AssetRow[]) {
  const byId = new Map<string, AssetRow>();
  for (const asset of assets) {
    byId.set(asset.id, asset);
  }
  return [...byId.values()];
}

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
    const dialogueSpeakerIds =
      data.dialogueSpeakerIds ?? (await this.resolveDialogueSpeakerIds(projectId, data.dialogueSpeaker));
    if (dialogueSpeakerIds.length > 0) {
      await this.setDialogueSpeakers(shot.id, dialogueSpeakerIds);
    }
    const withAssets = await this.attachAssets([shot]);
    return withAssets[0];
  }

  async update(id: string, data: UpdateShotInput): Promise<ShotWithAssets | null> {
    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }

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

  async setDialogueSpeakers(shotId: string, assetIds: string[]): Promise<void> {
    await db.delete(shotDialogueSpeakers).where(eq(shotDialogueSpeakers.shotId, shotId));

    const uniqueAssetIds = [...new Set(assetIds.filter(Boolean))];
    if (uniqueAssetIds.length === 0) {
      await db.update(shots).set({ dialogueSpeaker: "" }).where(eq(shots.id, shotId));
      return;
    }

    const speakerAssets = await db
      .select()
      .from(projectAssets)
      .where(and(inArray(projectAssets.id, uniqueAssetIds), eq(projectAssets.type, "character")));
    const speakerById = new Map(speakerAssets.map((asset) => [asset.id, asset]));
    const orderedSpeakerAssets = uniqueAssetIds
      .map((assetId) => speakerById.get(assetId))
      .filter((asset): asset is typeof speakerAssets[number] => Boolean(asset));

    if (orderedSpeakerAssets.length === 0) {
      await db.update(shots).set({ dialogueSpeaker: "" }).where(eq(shots.id, shotId));
      return;
    }

    await db.insert(shotDialogueSpeakers).values(
      orderedSpeakerAssets.map((asset) => ({
        shotId,
        assetId: asset.id,
      }))
    );

    await db
      .update(shots)
      .set({ dialogueSpeaker: orderedSpeakerAssets.map((asset) => asset.name).join("、") })
      .where(eq(shots.id, shotId));
  }

  async findAssetsByShot(shotId: string): Promise<AssetRow[]> {
    const assetRows = await db
      .select({ asset: projectAssets })
      .from(shotAssets)
      .innerJoin(projectAssets, eq(shotAssets.assetId, projectAssets.id))
      .where(eq(shotAssets.shotId, shotId));
    const speakerAssets = await this.findDialogueSpeakersByShot(shotId);

    return uniqueAssets([...assetRows.map((row) => row.asset as AssetRow), ...speakerAssets]);
  }

  async findDialogueSpeakersByShot(shotId: string): Promise<AssetRow[]> {
    const rows = await db
      .select({ asset: projectAssets })
      .from(shotDialogueSpeakers)
      .innerJoin(projectAssets, eq(shotDialogueSpeakers.assetId, projectAssets.id))
      .where(eq(shotDialogueSpeakers.shotId, shotId));
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
    const joinedDialogueSpeakers = await db
      .select({ shotId: shotDialogueSpeakers.shotId, asset: projectAssets })
      .from(shotDialogueSpeakers)
      .innerJoin(projectAssets, eq(shotDialogueSpeakers.assetId, projectAssets.id))
      .where(inArray(shotDialogueSpeakers.shotId, shotIds));

    const byShot = new Map<string, AssetRow[]>();
    for (const row of joined) {
      const list = byShot.get(row.shotId) ?? [];
      list.push(row.asset as AssetRow);
      byShot.set(row.shotId, list);
    }

    const speakersByShot = new Map<string, AssetRow[]>();
    for (const row of joinedDialogueSpeakers) {
      const list = speakersByShot.get(row.shotId) ?? [];
      list.push(row.asset as AssetRow);
      speakersByShot.set(row.shotId, list);
    }

    return rows.map((shot) => {
      const assets = byShot.get(shot.id) ?? [];
      const dialogueSpeakers = speakersByShot.get(shot.id) ?? [];
      const dialogueSpeaker = dialogueSpeakers.length > 0
        ? dialogueSpeakers.map((asset) => asset.name).join("、")
        : shot.dialogueSpeaker;
      return {
        ...shot,
        dialogueSpeaker,
        assetIds: assets.map((asset) => asset.id),
        assets,
        dialogueSpeakerIds: dialogueSpeakers.map((asset) => asset.id),
        dialogueSpeakers,
      };
    });
  }

  private async resolveDialogueSpeakerIds(
    projectId: string,
    dialogueSpeaker: string | null | undefined
  ): Promise<string[]> {
    const names = splitDialogueSpeakerNames(dialogueSpeaker);
    if (names.length === 0) return [];

    const assets = await db
      .select()
      .from(projectAssets)
      .where(and(eq(projectAssets.projectId, projectId), eq(projectAssets.type, "character")));

    const resolved = new Set<string>();
    for (const name of names) {
      const normalized = normalizeAssetName(name);
      if (!normalized) continue;

      const exactMatch = assets.find((asset) => normalizeAssetName(asset.name) === normalized);
      if (exactMatch) {
        resolved.add(exactMatch.id);
        continue;
      }

      const looseMatch = assets.find((asset) => {
        const normalizedAssetName = normalizeAssetName(asset.name);
        return normalizedAssetName.includes(normalized) || normalized.includes(normalizedAssetName);
      });
      if (looseMatch) resolved.add(looseMatch.id);
    }

    return [...resolved];
  }
}
