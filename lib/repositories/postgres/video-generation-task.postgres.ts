import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { videoGenerationTasks } from "@/lib/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { VideoGenerationTaskRow } from "@/lib/db/types";
import type {
  CreateVideoGenerationTaskInput,
  IVideoGenerationTaskRepository,
  UpdateVideoGenerationTaskInput,
} from "../interfaces/video-generation-task.repository";

const ACTIVE_STATUSES = ["queued", "running", "unknown"] as const;

export class VideoGenerationTaskPostgresRepository implements IVideoGenerationTaskRepository {
  async findById(id: string): Promise<VideoGenerationTaskRow | null> {
    const rows = await db.select().from(videoGenerationTasks).where(eq(videoGenerationTasks.id, id));
    return rows[0] ?? null;
  }

  async findByProviderTaskId(providerTaskId: string): Promise<VideoGenerationTaskRow | null> {
    const rows = await db
      .select()
      .from(videoGenerationTasks)
      .where(eq(videoGenerationTasks.providerTaskId, providerTaskId));
    return rows[0] ?? null;
  }

  async findActiveByProject(projectId: string): Promise<VideoGenerationTaskRow[]> {
    return db
      .select()
      .from(videoGenerationTasks)
      .where(
        and(
          eq(videoGenerationTasks.projectId, projectId),
          inArray(videoGenerationTasks.status, [...ACTIVE_STATUSES])
        )
      )
      .orderBy(desc(videoGenerationTasks.createdAt));
  }

  async create(data: CreateVideoGenerationTaskInput): Promise<VideoGenerationTaskRow> {
    const now = new Date();
    const rows = await db
      .insert(videoGenerationTasks)
      .values({
        id: randomUUID(),
        projectId: data.projectId,
        shotId: data.shotId,
        providerTaskId: data.providerTaskId,
        provider: data.provider,
        model: data.model,
        status: data.status,
        prompt: data.prompt,
        metadata: data.metadata ?? {},
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return rows[0];
  }

  async update(id: string, data: UpdateVideoGenerationTaskInput): Promise<VideoGenerationTaskRow | null> {
    const rows = await db
      .update(videoGenerationTasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(videoGenerationTasks.id, id))
      .returning();
    return rows[0] ?? null;
  }
}
