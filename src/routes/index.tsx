import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/SiteShell";
import { PublicationCard } from "@/components/PublicationCard";
import { SubscribeBlock } from "@/components/SubscribeBlock";
import { CATEGORY_LABELS, TYPE_LABELS, formatDate, type Publication } from "@/lib/categories";
import { listPublishedPublications } from "@/lib/firebase/publications";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Timba Papers — Jameson Timba" },
      {
        name: "description",
        content:
          "A publication series on democracy, constitutionalism and political economy — Zimbabwe and Africa.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ["home-publications"],
    queryFn: async () => {
      return listPublishedPublications({ limit: 20 }) as Promise<Publication[]>;
    },
  });

  const featured = data?.find((p) => p.is_featured) ?? data?.[0];
  const recent = (data ?? []).filter((p) => p.id !== featured?.id).slice(0, 6);

  return (
    <SiteShell>
      {/* Hero */}
      <section className="border-b border-divider">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 md:py-24">
          {featured ? (
            <Link to="/p/$slug" params={{ slug: featured.slug }} className="block group">
              <div className="pub-number">{featured.publication_number}</div>
              <div className="mt-3 flex items-center gap-3 text-xs text-text-secondary uppercase tracking-wider">
                <span>{TYPE_LABELS[featured.type]}</span>
                {featured.category && <span>· {CATEGORY_LABELS[featured.category]}</span>}
                <span>· {formatDate(featured.publication_date)}</span>
              </div>
              <h1 className="mt-6 font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight max-w-5xl group-hover:text-gold transition-colors">
                {featured.title}
              </h1>
              {featured.excerpt && (
                <p className="mt-8 text-lg md:text-xl text-text-secondary max-w-3xl leading-relaxed">
                  {featured.excerpt}
                </p>
              )}
              <div className="mt-10 inline-flex items-center gap-2 text-gold text-sm uppercase tracking-wider">
                Read the essay <span>→</span>
              </div>
            </Link>
          ) : (
            <div className="h-64 flex items-center text-text-secondary">
              {isLoading ? "Loading…" : "No publications yet."}
            </div>
          )}
        </div>
      </section>

      {/* Volume banner */}
      <section className="bg-surface border-b border-divider">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 md:py-16 grid md:grid-cols-3 gap-8 items-start">
          <div className="pub-number">The Timba Papers</div>
          <div className="md:col-span-2">
            <h2 className="font-serif text-3xl md:text-4xl leading-tight">
              Volume I (2025–2026) — Democracy, Constitutionalism and the Future of Zimbabwe
            </h2>
            <p className="mt-4 text-text-secondary leading-relaxed max-w-2xl">
              A coherent body of essays, policy papers and speeches addressing the
              architecture of legitimate authority, the political economy of patience,
              and Africa's position in a multipolar world.
            </p>
            <Link
              to="/papers"
              className="mt-6 inline-flex items-center gap-2 text-gold text-sm uppercase tracking-wider"
            >
              Browse the archive →
            </Link>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid md:grid-cols-3 gap-10">
        <div className="pub-number">Editorial Note</div>
        <p className="md:col-span-2 font-serif text-2xl md:text-3xl leading-snug text-foreground">
          The Timba Papers publishes essays, policy papers, speeches and commentary on
          democracy, constitutionalism, and political economy — with a focus on
          Zimbabwe and Africa.
        </p>
      </section>

      {/* Recent */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-20">
        <div className="flex items-end justify-between mb-10">
          <h2 className="font-serif text-3xl md:text-4xl">Recent Publications</h2>
          <Link to="/papers" className="text-gold text-sm uppercase tracking-wider hidden sm:inline">
            All papers →
          </Link>
        </div>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {recent.map((p) => (
            <PublicationCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* Subscribe */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        <SubscribeBlock />
      </section>
    </SiteShell>
  );
}
