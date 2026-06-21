import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/SiteShell";
import { SubscribeBlock } from "@/components/SubscribeBlock";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — The Timba Papers" },
      {
        name: "description",
        content:
          "About Jameson Timba — Zimbabwean public intellectual, politician and policy thinker.",
      },
      { property: "og:title", content: "About — The Timba Papers" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <SiteShell>
      <article className="max-w-3xl mx-auto px-6 lg:px-10 py-20">
        <div className="pub-number">About the author</div>
        <h1 className="mt-3 font-serif text-5xl md:text-6xl leading-tight">Jameson Timba</h1>
        <div className="gold-rule mt-8" />
        <figure className="mt-10 max-w-xs">
          <img
            src="/images/timba.jpeg"
            alt="Jameson Timba"
            width={320}
            height={400}
            className="w-full border border-divider object-cover aspect-[4/5]"
          />
        </figure>
        <div className="mt-10 prose-paper text-lg">
          <p>
            Jameson Timba is a Zimbabwean public intellectual, politician and policy
            thinker whose work addresses the architecture of legitimate authority and
            the political economy of African renewal.
          </p>
          <p>
            Across essays, speeches and longer policy papers, he argues for a
            disciplined constitutionalism, a confident African position in a
            multipolar world, and a politics that takes the long view.
          </p>
        </div>
        <div className="mt-16">
          <SubscribeBlock />
        </div>
      </article>
    </SiteShell>
  );
}