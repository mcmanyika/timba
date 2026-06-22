import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { SiteShell } from "@/components/SiteShell";
import { PublicationCard } from "@/components/PublicationCard";
import { HomeVolumeParallax } from "@/components/HomeVolumeParallax";
import { SubscribeBlock } from "@/components/SubscribeBlock";
import { CATEGORY_LABELS, TYPE_LABELS, formatDate, type Publication } from "@/lib/categories";
import { listPublishedPublications } from "@/lib/firebase/publications";
import { cn } from "@/lib/utils";

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

function HomeReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("home-reveal", className)}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

function HomeScrollReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("home-scroll-reveal", visible && "is-visible", className)}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

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
              <HomeReveal delay={0}>
                <div className="pub-number">{featured.publication_number}</div>
              </HomeReveal>
              <HomeReveal delay={80}>
                <div className="mt-3 flex items-center gap-3 text-xs text-text-secondary uppercase tracking-wider">
                  <span>{TYPE_LABELS[featured.type]}</span>
                  {featured.category && <span>· {CATEGORY_LABELS[featured.category]}</span>}
                  <span>· {formatDate(featured.publication_date)}</span>
                </div>
              </HomeReveal>
              <HomeReveal delay={160}>
                <h1 className="mt-6 font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight max-w-5xl group-hover:text-gold transition-colors">
                  {featured.title}
                </h1>
              </HomeReveal>
              {featured.excerpt && (
                <HomeReveal delay={240}>
                  <p className="mt-8 text-lg md:text-xl text-text-secondary max-w-3xl leading-relaxed">
                    {featured.excerpt}
                  </p>
                </HomeReveal>
              )}
              <HomeReveal delay={320}>
                <div className="mt-10 inline-flex items-center gap-2 text-gold text-sm uppercase tracking-wider">
                  Read the essay <span>→</span>
                </div>
              </HomeReveal>
            </Link>
          ) : (
            <HomeReveal delay={0}>
              <div className="h-64 flex items-center text-text-secondary">
                {isLoading ? "Loading…" : "No publications yet."}
              </div>
            </HomeReveal>
          )}
        </div>
      </section>

      {/* Volume banner */}
      <HomeVolumeParallax />

      {/* Intro */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid md:grid-cols-3 gap-10">
        <HomeScrollReveal delay={0}>
          <div className="pub-number">Editorial Note</div>
        </HomeScrollReveal>
        <HomeScrollReveal delay={120} className="md:col-span-2">
          <p className="font-serif text-2xl md:text-3xl leading-snug text-foreground">
            The Timba Papers publishes essays, policy papers, speeches and commentary on
            democracy, constitutionalism, and political economy — with a focus on
            Zimbabwe and Africa.
          </p>
        </HomeScrollReveal>
      </section>

      {/* Recent */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-20">
        <HomeScrollReveal delay={0}>
          <div className="flex items-end justify-between mb-10">
            <h2 className="font-serif text-3xl md:text-4xl">Recent Publications</h2>
            <Link to="/papers" className="text-gold text-sm uppercase tracking-wider hidden sm:inline">
              All papers →
            </Link>
          </div>
        </HomeScrollReveal>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {recent.map((p, i) => (
            <HomeScrollReveal key={p.id} delay={80 + i * 90}>
              <PublicationCard p={p} />
            </HomeScrollReveal>
          ))}
        </div>
      </section>

      {/* Subscribe */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        <HomeScrollReveal delay={0}>
          <SubscribeBlock />
        </HomeScrollReveal>
      </section>
    </SiteShell>
  );
}
