import ProjectSidebar from "@/components/project/ProjectSidebar";
import StepContent    from "@/components/project/StepContent";

export default function ProjectPage() {
  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      <ProjectSidebar />
      <StepContent />
    </div>
  );
}
