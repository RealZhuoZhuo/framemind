import { notFound } from "next/navigation";
import { projectRepo } from "@/lib/repositories";
import ProjectPageClient from "./ProjectPageClient";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await projectRepo.findById(id);
  if (!project) {
    notFound();
  }
  return <ProjectPageClient projectId={id} />;
}
