import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { SiteShell } from "@/components/SiteShell";
import { SubscribeBlock } from "@/components/SubscribeBlock";
import { fetchPublishedQuotes, PUBLIC_QUOTES_QUERY_KEY } from "@/lib/api/quotes.functions";

export const Route = createFileRoute("/quotes")({
  loader: async ({ context }) => {
    return context.queryClient.ensureQueryData({
      queryKey: PUBLIC_QUOTES_QUERY_KEY,
      queryFn: () => fetchPublishedQuotes(),
    });
  },
  head: () => ({
    meta: [
      { title: "Quotes — The Timba Papers" },
      {
        name: "description",
        content:
          "Selected quotations from Jameson Timba on democracy, constitutionalism, Zimbabwe and Africa.",
      },
      { property: "og:title", content: "Quotes — The Timba Papers" },
    ],
  }),
  component: QuotesPage,
});

function QuotesPage() {
  const loaderData = Route.useLoaderData();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: PUBLIC_QUOTES_QUERY_KEY,
    queryFn: () => fetchPublishedQuotes(),
    initialData: loaderData,
    staleTime: 60_000,
  });

  return (
    <SiteShell>
      <article className="max-w-3xl mx-auto px-6 lg:px-10 py-20">
        <div className="pub-number">Quotations</div>
        <h1 className="mt-3 font-serif text-5xl md:text-6xl leading-tight">Quotes</h1>
        <p className="mt-6 text-text-secondary text-lg max-w-2xl leading-relaxed">
          Words on democracy, constitutionalism, and the long work of renewal — drawn from
          essays, speeches, and public life.
        </p>
        <div className="gold-rule mt-10" />

        {isLoading ? (
          <p className="mt-12 text-text-secondary">Loading…</p>
        ) : isError ? (
          <p className="mt-12 text-destructive text-sm">
            Could not load quotes.{" "}
            {error instanceof Error ? error.message : "Please try again later."}
          </p>
        ) : (data?.length ?? 0) === 0 ? (
          <p className="mt-12 text-text-secondary">No quotes published yet.</p>
        ) : (
          <ul className="mt-12 space-y-12">
            {(data ?? []).map((q) => (
              <li key={q.id} className="border-l-2 border-gold pl-6 md:pl-8">
                <blockquote className="font-serif text-2xl md:text-3xl leading-snug text-foreground">
                  “{q.text}”
                </blockquote>
                {(q.attribution || q.source_url) && (
                  <footer className="mt-4 text-sm text-text-secondary">
                    {q.attribution && <cite className="not-italic">{q.attribution}</cite>}
                    {q.source_url && (
                      <>
                        {q.attribution && " · "}
                        <a
                          href={q.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gold hover:underline"
                        >
                          Source
                        </a>
                      </>
                    )}
                  </footer>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-20">
          <SubscribeBlock variant="inline" />
        </div>
      </article>
    </SiteShell>
  );
}
