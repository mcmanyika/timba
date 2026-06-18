import type { Publication } from "@/lib/categories";

export interface AdminStats {
  total: number;
  published: number;
  drafts: number;
  featured: number;
  byType: Record<string, number>;
  recent: Publication[];
  draftRecent: Publication[];
}

export function computeAdminStats(publications: Publication[]): AdminStats {
  const published = publications.filter((p) => p.published);
  const drafts = publications.filter((p) => !p.published);
  const byType: Record<string, number> = {};

  for (const p of publications) {
    byType[p.type] = (byType[p.type] ?? 0) + 1;
  }

  const sorted = [...publications].sort(
    (a, b) => new Date(b.updated_at || b.publication_date).getTime() -
      new Date(a.updated_at || a.publication_date).getTime(),
  );

  return {
    total: publications.length,
    published: published.length,
    drafts: drafts.length,
    featured: publications.filter((p) => p.is_featured).length,
    byType,
    recent: sorted.slice(0, 5),
    draftRecent: drafts.slice(0, 5),
  };
}
