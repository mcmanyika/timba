import { createFileRoute } from "@tanstack/react-router";

import { ArchiveView } from "@/components/ArchiveView";
import { SiteShell } from "@/components/SiteShell";
import { SubscribeBlock } from "@/components/SubscribeBlock";

export const Route = createFileRoute("/press")({
  head: () => ({
    meta: [
      { title: "Press Statements — The Timba Papers" },
      {
        name: "description",
        content: "Press statements by Jameson Timba.",
      },
      { property: "og:title", content: "Press Statements — The Timba Papers" },
    ],
  }),
  component: () => (
    <SiteShell>
      <ArchiveView
        title="Press Statements"
        description="Official statements on public affairs, democracy, and Zimbabwe."
        type="press_statement"
      />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        <SubscribeBlock />
      </div>
    </SiteShell>
  ),
});
