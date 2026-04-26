import { projectRepo, stepRepo } from "@/lib/repositories";

export async function getProjectScript(projectId: string) {
  const project = await projectRepo.findById(projectId);
  if (!project) {
    return null;
  }

  if (project.script.trim()) {
    return project.script;
  }

  const steps = await stepRepo.findByProject(projectId);
  const scriptStep = steps.find((step) => step.stepKey === "script");
  return scriptStep?.content?.trim() || "";
}
