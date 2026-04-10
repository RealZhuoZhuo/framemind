import { db } from "@/lib/db";
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
    return db.select().from(projects).orderBy(desc(projects.updatedAt));
  }

  async findById(id: string): Promise<ProjectRow | null> {
    const rows = await db.select().from(projects).where(eq(projects.id, id));
    return rows[0] ?? null;
  }

  async create(data: CreateProjectInput): Promise<ProjectRow> {
    const rows = await db
      .insert(projects)
      .values({
        title: data.title ?? "未命名",
        gradient: data.gradient,
        videoMode: data.videoMode,
        aspectRatio: data.aspectRatio,
        visualStyle: data.visualStyle,
      })
      .returning();
    return rows[0];
  }

  async update(id: string, data: UpdateProjectInput): Promise<ProjectRow | null> {
    const rows = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async delete(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }
}
