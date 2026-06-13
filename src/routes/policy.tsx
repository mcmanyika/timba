import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/SiteShell";
import { ArchiveView } from "@/components/ArchiveView";
import { SubscribeBlock } from "@/components/SubscribeBlock";

export const Route = createFileRoute("/policy")({
  head: () => ({
    meta: [
      { title: "Policy Papers — The Timba Papers" },
      {
        name: "description",
        content:
          "Longer analytical work: Geo-Economic Deterrence, Democratic Renewal, the Africa Democratic Renewal Initiative, and Constitutional Reform.",
      },
      { property: "og:title", content: "Policy Papers — The Timba Papers" },
    ],
  }),
  component: () => (
    <SiteShell>
      <ArchiveView
        title="Policy Papers"
        description="Longer analytical work on constitutional reform, democratic renewal, geo-economic deterrence, and the African position in a multipolar world."
        type="policy_paper"
      />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        <SubscribeBlock />
      </div>
    </SiteShell>
  ),
});