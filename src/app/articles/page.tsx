import type { Metadata } from "next";

import { ArticlesExplorer } from "@/components/articles/articles-explorer";

export const metadata: Metadata = {
  title: "مقالات حقوقی",
  description: "مقالات آموزشی و تحلیلی برای تصمیم بهتر قبل از امضا.",
};

export default function ArticlesPage() {
  return <ArticlesExplorer />;
}
