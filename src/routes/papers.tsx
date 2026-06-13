import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/SiteShell";
import { ArchiveView } from "@/components/ArchiveView";
import { SubscribeBlock } from "@/components/SubscribeBlock";
import { ESSAY_CATEGORIES } from "@/lib/categories";

export const Route = createFileRoute("/papers")({
  head: () => ({
    meta: [
      { title: "The Timba Papers — Archive" },
      {
        name: "description",
        content:
          "Full searchable archive of essays and commentary on democracy, constitutionalism, Zimbabwe, Africa and global affairs.",
      },
      { property: "og:title", content: "The Timba Papers — Archive" },
    ],
  }),
  component: () => (
    <SiteShell>
      <ArchiveView
        title="The Timba Papers"
        description="A searchable archive of essays and commentary on democracy, constitutionalism, political economy, and the African position in world affairs."
        type="essay"
        categories={ESSAY_CATEGORIES}
      />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        <SubscribeBlock />
      </div>
    </SiteShell>
  ),
});