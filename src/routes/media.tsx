import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/SiteShell";
import { ArchiveView } from "@/components/ArchiveView";
import { SubscribeBlock } from "@/components/SubscribeBlock";
import { MEDIA_CATEGORIES } from "@/lib/categories";

export const Route = createFileRoute("/media")({
  head: () => ({
    meta: [
      { title: "Media — The Timba Papers" },
      {
        name: "description",
        content: "Interviews, podcasts and television appearances featuring Jameson Timba.",
      },
      { property: "og:title", content: "Media — The Timba Papers" },
    ],
  }),
  component: () => (
    <SiteShell>
      <ArchiveView
        title="Media"
        description="Interviews, podcasts and television appearances."
        type="media"
        categories={MEDIA_CATEGORIES}
      />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        <SubscribeBlock />
      </div>
    </SiteShell>
  ),
});