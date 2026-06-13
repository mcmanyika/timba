import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/SiteShell";
import { SubscribeBlock } from "@/components/SubscribeBlock";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, type Publication } from "@/lib/categories";

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "Books — The Timba Papers" },
      {
        name: "description",
        content:
          "Books by Jameson Timba: Guest of the State and Courage Is the Root of Change.",
      },
      { property: "og:title", content: "Books — The Timba Papers" },
    ],
  }),
  component: Books,
});

function Books() {
  const { data } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("publications")
        .select("*")
        .eq("published", true)
        .eq("type", "book")
        .order("publication_date", { ascending: false });
      if (error) throw error;
      return data as Publication[];
    },
  });

  return (
    <SiteShell>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="border-b border-divider pb-10">
          <div className="pub-number">Books</div>
          <h1 className="mt-3 font-serif text-5xl md:text-6xl">Books</h1>
        </div>
        <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((b) => (
            <Link
              to="/p/$slug"
              params={{ slug: b.slug }}
              key={b.id}
              className="block border border-divider p-8 hover:border-gold transition-colors group"
            >
              <div className="pub-number">{b.publication_number}</div>
              <h2 className="mt-4 font-serif text-3xl group-hover:text-gold transition-colors">
                {b.title}
              </h2>
              <p className="mt-3 text-sm text-text-secondary">{formatDate(b.publication_date)}</p>
              {b.excerpt && (
                <p className="mt-5 text-text-secondary leading-relaxed">{b.excerpt}</p>
              )}
            </Link>
          ))}
          <div className="border border-dashed border-divider p-8">
            <div className="pub-number">Forthcoming</div>
            <h2 className="mt-4 font-serif text-3xl">A Third Volume</h2>
            <p className="mt-3 text-sm text-text-secondary">In preparation</p>
            <p className="mt-5 text-text-secondary leading-relaxed">
              A forthcoming volume of essays and political reflection.
            </p>
            <div className="mt-6">
              <SubscribeBlock variant="inline" />
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}