import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { ensureDatabaseSchema } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type {
  IProjectRepository,
  CreateProjectInput,
  UpdateProjectInput,
} from "../interfaces/project.repository";
import type { ProjectRow } from "@/lib/db/types";

export class ProjectPostgresRepository implements IProjectRepository {
  async findAll(): Promise<ProjectRow[]> {
    await ensureDatabaseSchema();
    return db.select().from(projects).orderBy(desc(projects.updatedAt));
  }

  async findById(id: string): Promise<ProjectRow | null> {
    await ensureDatabaseSchema();
    const rows = await db.select().from(projects).where(eq(projects.id, id));
    return rows[0] ?? null;
  }

  async create(data: CreateProjectInput): Promise<ProjectRow> {
    await ensureDatabaseSchema();
    const now = new Date();
    const rows = await db
      .insert(projects)
      .values({
        id: randomUUID(),
        title: data.title ?? "未命名",
        script: data.script ?? "",
        videoMode: data.videoMode,
        aspectRatio: data.aspectRatio,
        visualStyle: data.visualStyle,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return rows[0];
  }

  async update(id: string, data: UpdateProjectInput): Promise<ProjectRow | null> {
    await ensureDatabaseSchema();
    const rows = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async delete(id: string): Promise<void> {
    await ensureDatabaseSchema();
    await db.delete(projects).where(eq(projects.id, id));
  }
}
