import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicationBody } from "@/components/PublicationBody";
import { ArticleComments } from "@/components/ArticleComments";
import { ArticleLikeButton } from "@/components/ArticleLikeButton";
import { ArticleWhatsAppShare } from "@/components/ArticleWhatsAppShare";
import { SiteShell } from "@/components/SiteShell";
import { SubscribeBlock } from "@/components/SubscribeBlock";
import { CATEGORY_LABELS, TYPE_LABELS, formatDate } from "@/lib/categories";
import { getPublicationBySlug } from "@/lib/firebase/publications";

export const Route = createFileRoute("/p/$slug")({
  component: Detail,
  notFoundComponent: () => (
    <SiteShell>
      <div className="max-w-3xl mx-auto px-6 py-32 text-center">
        <div className="pub-number">404</div>
        <h1 className="mt-3 font-serif text-4xl">Publication not found</h1>
        <Link to="/papers" className="mt-6 inline-block text-gold">
          Back to the archive →
        </Link>
      </div>
    </SiteShell>
  ),
  errorComponent: () => (
    <SiteShell>
      <div className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="font-serif text-3xl">This page did not load</h1>
        <Link to="/" className="mt-6 inline-block text-gold">
          Return home →
        </Link>
      </div>
    </SiteShell>
  ),
});

function Detail() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["pub", slug],
    queryFn: async () => {
      const data = await getPublicationBySlug(slug);
      if (!data) throw notFound();
      return data;
    },
  });

  if (isLoading) {
    return (
      <SiteShell>
        <div className="max-w-3xl mx-auto px-6 py-32 text-text-secondary">Loading…</div>
      </SiteShell>
    );
  }
  if (!data) return null;

  return (
    <SiteShell>
      <article className="max-w-3xl mx-auto px-6 lg:px-10 py-16 md:py-24">
        <div className="pub-number">{data.publication_number}</div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-secondary uppercase tracking-wider">
          <span>{TYPE_LABELS[data.type]}</span>
          {data.category && <span>· {CATEGORY_LABELS[data.category]}</span>}
          <span>· {formatDate(data.publication_date)}</span>
          {data.location && <span>· {data.location}</span>}
        </div>
        <h1 className="mt-6 font-serif text-4xl md:text-6xl leading-[1.1] tracking-tight">
          {data.title}
        </h1>
        {data.excerpt && (
          <p className="mt-8 text-xl text-text-secondary leading-relaxed font-serif italic">
            {data.excerpt}
          </p>
        )}
        <div className="gold-rule mt-10" />
        <div className="mt-10">
          <PublicationBody body={data.body} />
        </div>

        {data.media_embed_url && (
          <div className="mt-10 aspect-video">
            <iframe
              src={data.media_embed_url}
              className="w-full h-full border border-divider"
              allowFullScreen
              title={data.title}
            />
          </div>
        )}

        {data.pdf_url && (
          <div className="mt-10">
            <a
              href={data.pdf_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-gold text-gold px-5 py-3 text-sm uppercase tracking-wider hover:bg-gold hover:text-background transition-colors"
            >
              Download PDF →
            </a>
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <ArticleLikeButton publicationId={data.id} />
          <ArticleWhatsAppShare title={data.title} slug={data.slug} />
        </div>

        <ArticleComments
          publicationId={data.id}
          publicationSlug={data.slug}
          publicationTitle={data.title}
        />

        <div className="mt-20">
          <SubscribeBlock />
        </div>
      </article>
    </SiteShell>
  );
}