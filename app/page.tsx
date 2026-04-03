import Navbar from "@/components/Navbar";
import BannerCarousel from "@/components/BannerCarousel";
import ProjectGrid from "@/components/ProjectGrid";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      <Navbar />

      <main className="flex-1 px-8 py-10 max-w-6xl mx-auto w-full space-y-10">
        {/* Banner Carousel */}
        <BannerCarousel />

        {/* Project Grid */}
        <ProjectGrid />
      </main>
    </div>
  );
}
