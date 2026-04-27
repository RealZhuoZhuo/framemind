import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { videoClips } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type {
  IVideoClipRepository,
  CreateClipInput,
  UpdateClipInput,
} from "../interfaces/video-clip.repository";
import type { VideoClipRow } from "@/lib/db/types";

export class VideoClipPostgresRepository implements IVideoClipRepository {
  async findByProject(projectId: string): Promise<VideoClipRow[]> {
    return db.select().from(videoClips).where(eq(videoClips.projectId, projectId));
  }

  async findById(id: string): Promise<VideoClipRow | null> {
    const rows = await db.select().from(videoClips).where(eq(videoClips.id, id));
    return rows[0] ?? null;
  }

  async create(projectId: string, data: CreateClipInput): Promise<VideoClipRow> {
    const rows = await db
      .insert(videoClips)
      .values({
        id: randomUUID(),
        projectId,
        clipType: data.clipType,
        startSec: data.startSec,
        endSec: data.endSec,
        label: data.label ?? "",
        mediaUrl: data.mediaUrl ?? null,
        subtitleText: data.subtitleText ?? null,
        sourceShotId: data.sourceShotId ?? null,
      })
      .returning();
    return rows[0];
  }

  async update(id: string, data: UpdateClipInput): Promise<VideoClipRow | null> {
    const rows = await db
      .update(videoClips)
      .set(data)
      .where(eq(videoClips.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async delete(id: string): Promise<void> {
    await db.delete(videoClips).where(eq(videoClips.id, id));
  }

  async replaceAll(projectId: string, clips: CreateClipInput[]): Promise<VideoClipRow[]> {
    return db.transaction(async (tx) => {
      await tx.delete(videoClips).where(eq(videoClips.projectId, projectId));
      if (clips.length === 0) return [];
      return tx
        .insert(videoClips)
        .values(
          clips.map((c) => ({
            id: randomUUID(),
            projectId,
            clipType: c.clipType,
            startSec: c.startSec,
            endSec: c.endSec,
            label: c.label ?? "",
            mediaUrl: c.mediaUrl ?? null,
            subtitleText: c.subtitleText ?? null,
            sourceShotId: c.sourceShotId ?? null,
          }))
        )
        .returning();
    });
  }

  async upsertVideoBySourceShot(projectId: string, shotId: string, data: CreateClipInput): Promise<VideoClipRow> {
    const existing = await db
      .select()
      .from(videoClips)
      .where(
        and(
          eq(videoClips.projectId, projectId),
          eq(videoClips.sourceShotId, shotId),
          eq(videoClips.clipType, "video")
        )
      );

    const values = {
      clipType: "video" as const,
      startSec: data.startSec,
      endSec: data.endSec,
      label: data.label ?? "",
      mediaUrl: data.mediaUrl ?? null,
      subtitleText: data.subtitleText ?? null,
      sourceShotId: shotId,
    };

    if (existing[0]) {
      const rows = await db
        .update(videoClips)
        .set(values)
        .where(eq(videoClips.id, existing[0].id))
        .returning();
      return rows[0];
    }

    const rows = await db
      .insert(videoClips)
      .values({
        id: randomUUID(),
        projectId,
        ...values,
      })
      .returning();
    return rows[0];
  }
}
