import type { ProjectRow } from "@/lib/db/types";

export interface IProjectRepository {
  findAll(): Promise<ProjectRow[]>;
  findById(id: string): Promise<ProjectRow | null>;
  create(data: CreateProjectInput): Promise<ProjectRow>;
  update(id: string, data: UpdateProjectInput): Promise<ProjectRow | null>;
  delete(id: string): Promise<void>;
}

export type CreateProjectInput = {
  title?: string;
  gradient: string;
  videoMode?: string;
  aspectRatio?: string;
  visualStyle?: string;
};

export type UpdateProjectInput = Partial<{
  title: string;
  gradient: string;
  videoMode: string;
  aspectRatio: string;
  visualStyle: string;
}>;
