import { ArticlesPreview } from "@/components/home/articles-preview";
import { Hero } from "@/components/home/hero";
import { ServiceGrid } from "@/components/home/service-grid";
import { StatsBand } from "@/components/home/stats-band";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServiceGrid />
      <StatsBand />
      <ArticlesPreview />
    </>
  );
}
