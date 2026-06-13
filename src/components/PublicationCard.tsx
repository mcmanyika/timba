import { Link } from "@tanstack/react-router";
import { CATEGORY_LABELS, TYPE_LABELS, formatDate, type Publication } from "@/lib/categories";

export function PublicationCard({ p }: { p: Publication }) {
  return (
    <Link
      to="/p/$slug"
      params={{ slug: p.slug }}
      className="group block border-t border-divider pt-6 transition-colors hover:border-gold"
    >
      <div className="flex items-center gap-3 text-xs">
        <span className="pub-number">{p.publication_number}</span>
        <span className="text-text-secondary">·</span>
        <span className="text-text-secondary uppercase tracking-wider">
          {p.category ? CATEGORY_LABELS[p.category] : TYPE_LABELS[p.type]}
        </span>
      </div>
      <h3 className="mt-3 font-serif text-2xl leading-snug group-hover:text-gold transition-colors">
        {p.title}
      </h3>
      {p.excerpt && (
        <p className="mt-3 text-text-secondary leading-relaxed line-clamp-3">{p.excerpt}</p>
      )}
      <div className="mt-4 text-xs text-text-secondary">{formatDate(p.publication_date)}</div>
    </Link>
  );
}