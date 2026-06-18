import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { SubscribeBlock } from "@/components/SubscribeBlock";
import { CATEGORY_LABELS, SPEECH_CATEGORIES, formatDate } from "@/lib/categories";
import { listPublishedPublications } from "@/lib/firebase/publications";

export const Route = createFileRoute("/speeches")({
  head: () => ({
    meta: [
      { title: "Speeches — The Timba Papers" },
      {
        name: "description",
        content:
          "Speeches by Jameson Timba in Parliament, at conferences, international engagements, and DCP addresses.",
      },
      { property: "og:title", content: "Speeches — The Timba Papers" },
    ],
  }),
  component: Speeches,
});

function Speeches() {
  const [cat, setCat] = useState<string>("all");
  const { data } = useQuery({
    queryKey: ["speeches"],
    queryFn: () => listPublishedPublications({ type: "speech" }),
  });
  const list = (data ?? []).filter((p) => cat === "all" || p.category === cat);

  return (
    <SiteShell>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="border-b border-divider pb-10">
          <div className="pub-number">Speeches</div>
          <h1 className="mt-3 font-serif text-5xl md:text-6xl">Speeches</h1>
          <p className="mt-6 text-text-secondary max-w-2xl text-lg leading-relaxed">
            Addresses in Parliament, at continental conferences, international engagements
            and addresses to the Democratic Citizens Platform.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap gap-2">
          {(["all", ...SPEECH_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`text-xs uppercase tracking-wider px-3 py-2 border transition-colors ${
                cat === c
                  ? "border-gold text-gold"
                  : "border-divider text-text-secondary hover:text-foreground"
              }`}
            >
              {c === "all" ? "All" : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
        <ul className="mt-12 divide-y divide-divider">
          {list.map((s) => (
            <li key={s.id}>
              <Link
                to="/p/$slug"
                params={{ slug: s.slug }}
                className="grid md:grid-cols-12 gap-4 py-6 group"
              >
                <div className="md:col-span-2 pub-number self-start">{s.publication_number}</div>
                <div className="md:col-span-8">
                  <h3 className="font-serif text-2xl group-hover:text-gold transition-colors">
                    {s.title}
                  </h3>
                  <div className="mt-2 text-sm text-text-secondary">
                    {s.category && <>{CATEGORY_LABELS[s.category]}</>}
                    {s.location && <> · {s.location}</>}
                  </div>
                </div>
                <div className="md:col-span-2 text-sm text-text-secondary md:text-right">
                  {formatDate(s.publication_date)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-20">
          <SubscribeBlock />
        </div>
      </div>
    </SiteShell>
  );
}