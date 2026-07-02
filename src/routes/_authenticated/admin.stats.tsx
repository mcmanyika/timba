import { createFileRoute, Link, redirect, getRouteApi } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AdminPageHeader } from "@/components/admin/AdminLayout";
import {
  ADMIN_STATS_QUERY_KEY,
  fetchAdminSiteStats,
} from "@/lib/api/stats.functions";
import { getFirebaseAuth } from "@/integrations/firebase/client";
import { TYPE_LABELS, formatDate } from "@/lib/categories";
import { INQUIRY_TYPE_LABELS } from "@/lib/firebase/inquiries";
import type { ArticleStatsRow } from "@/lib/firebase/stats-admin.server";

const adminRoute = getRouteApi("/_authenticated/admin");

export const Route = createFileRoute("/_authenticated/admin/stats")({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin && !context.editorAccess) throw redirect({ to: "/admin" });
  },
  component: AdminStats,
});

type SortKey = keyof Pick<
  ArticleStatsRow,
  "views" | "likes" | "comments" | "pulse_count" | "pulse_avg_recommend" | "publication_date"
>;

async function loadStats(includeAdminMetrics: boolean) {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Not signed in");
  const idToken = await user.getIdToken(true);
  return fetchAdminSiteStats({ data: { idToken, includeAdminMetrics } });
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-divider bg-surface p-4">
      <div className="pub-number">{label}</div>
      <div className="mt-2 font-serif text-3xl">{value}</div>
    </div>
  );
}

function pct(part: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function exportArticlesCsv(articles: ArticleStatsRow[]) {
  const header =
    "title,slug,type,publication_date,views,likes,comments,pulse_responses,pulse_avg_recommend,pulse_yes,pulse_somewhat,pulse_no";
  const rows = articles.map((a) =>
    [
      a.title,
      a.slug,
      a.type,
      a.publication_date,
      a.views,
      a.likes,
      a.comments,
      a.pulse_count,
      a.pulse_avg_recommend.toFixed(1),
      a.pulse_yes,
      a.pulse_somewhat,
      a.pulse_no,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `timba-papers-stats-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function AdminStats() {
  const { isAdmin } = adminRoute.useRouteContext();
  const [sortKey, setSortKey] = useState<SortKey>("views");
  const [sortDesc, setSortDesc] = useState(true);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: [...ADMIN_STATS_QUERY_KEY, isAdmin],
    queryFn: () => loadStats(isAdmin),
    retry: 1,
    refetchOnMount: "always",
  });

  const sortedArticles = useMemo(() => {
    const list = [...(data?.articles ?? [])];
    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDesc ? bv.localeCompare(av) : av.localeCompare(bv);
      }
      return sortDesc ? Number(bv) - Number(av) : Number(av) - Number(bv);
    });
    return list;
  }, [data?.articles, sortKey, sortDesc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDesc((d) => !d);
    else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  const o = data?.overview;
  const pulseTotal = (o?.pulse_yes ?? 0) + (o?.pulse_somewhat ?? 0) + (o?.pulse_no ?? 0);
  const loading = isLoading || (isFetching && !data);

  return (
    <>
      <AdminPageHeader
        title="Stats"
        description="Engagement, audience, and content performance across The Timba Papers."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={loading}
              className="border border-divider px-4 py-2 text-xs uppercase tracking-wider text-text-secondary hover:border-gold hover:text-gold transition-colors disabled:opacity-60"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => data && exportArticlesCsv(data.articles)}
              disabled={!data?.articles.length}
              className="bg-gold text-background px-4 py-2 text-xs uppercase tracking-wider hover:bg-gold/90 transition-colors disabled:opacity-60"
            >
              Export CSV
            </button>
          </div>
        }
      />

      {isError && (
        <p className="mb-6 text-destructive text-sm">
          Could not load stats. {error instanceof Error ? error.message : "Please try again."}
        </p>
      )}

      {loading ? (
        <p className="text-text-secondary text-sm">Loading stats…</p>
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="font-serif text-xl mb-4">Overview</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Published" value={o?.published_articles ?? 0} />
              <StatCard label="Total views" value={(o?.total_views ?? 0).toLocaleString()} />
              <StatCard label="Article likes" value={(o?.total_likes ?? 0).toLocaleString()} />
              <StatCard label="Comment likes" value={(o?.total_comment_likes ?? 0).toLocaleString()} />
              <StatCard label="Comments" value={o?.approved_comments ?? 0} />
              <StatCard label="Pending comments" value={o?.pending_comments ?? 0} />
              <StatCard label="Reader pulse" value={o?.pulse_responses ?? 0} />
              <StatCard
                label="Avg recommend"
                value={o?.pulse_avg_recommend ? o.pulse_avg_recommend.toFixed(1) : "—"}
              />
              {isAdmin && (
                <>
                  <StatCard label="Subscribers" value={o?.subscribers ?? 0} />
                  <StatCard label="New inquiries" value={o?.inquiries_new ?? 0} />
                </>
              )}
            </div>
          </section>

          {pulseTotal > 0 && (
            <section>
              <h2 className="font-serif text-xl mb-4">Reader pulse (site-wide)</h2>
              <div className="grid gap-3 sm:grid-cols-3 max-w-2xl">
                <div className="border border-divider px-4 py-3 bg-surface text-sm">
                  <div className="text-xs uppercase tracking-wider text-text-secondary">Yes</div>
                  <div className="mt-1 font-medium">
                    {o?.pulse_yes ?? 0}{" "}
                    <span className="text-text-secondary font-normal">
                      ({pct(o?.pulse_yes ?? 0, pulseTotal)})
                    </span>
                  </div>
                </div>
                <div className="border border-divider px-4 py-3 bg-surface text-sm">
                  <div className="text-xs uppercase tracking-wider text-text-secondary">
                    Somewhat
                  </div>
                  <div className="mt-1 font-medium">
                    {o?.pulse_somewhat ?? 0}{" "}
                    <span className="text-text-secondary font-normal">
                      ({pct(o?.pulse_somewhat ?? 0, pulseTotal)})
                    </span>
                  </div>
                </div>
                <div className="border border-divider px-4 py-3 bg-surface text-sm">
                  <div className="text-xs uppercase tracking-wider text-text-secondary">No</div>
                  <div className="mt-1 font-medium">
                    {o?.pulse_no ?? 0}{" "}
                    <span className="text-text-secondary font-normal">
                      ({pct(o?.pulse_no ?? 0, pulseTotal)})
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section>
            <h2 className="font-serif text-xl mb-4">Article performance</h2>
            {(data?.articles.length ?? 0) === 0 ? (
              <p className="text-text-secondary text-sm">No published articles yet.</p>
            ) : (
              <div className="overflow-x-auto border border-divider">
                <table className="w-full text-sm">
                  <thead className="bg-surface text-left text-xs uppercase tracking-wider text-text-secondary">
                    <tr>
                      <th className="p-3 font-normal">Article</th>
                      <th className="p-3 font-normal">
                        <button type="button" onClick={() => toggleSort("views")} className="hover:text-gold">
                          Views {sortKey === "views" ? (sortDesc ? "↓" : "↑") : ""}
                        </button>
                      </th>
                      <th className="p-3 font-normal">
                        <button type="button" onClick={() => toggleSort("likes")} className="hover:text-gold">
                          Likes {sortKey === "likes" ? (sortDesc ? "↓" : "↑") : ""}
                        </button>
                      </th>
                      <th className="p-3 font-normal">
                        <button
                          type="button"
                          onClick={() => toggleSort("comments")}
                          className="hover:text-gold"
                        >
                          Comments {sortKey === "comments" ? (sortDesc ? "↓" : "↑") : ""}
                        </button>
                      </th>
                      <th className="p-3 font-normal">
                        <button
                          type="button"
                          onClick={() => toggleSort("pulse_count")}
                          className="hover:text-gold"
                        >
                          Pulse {sortKey === "pulse_count" ? (sortDesc ? "↓" : "↑") : ""}
                        </button>
                      </th>
                      <th className="p-3 font-normal">
                        <button
                          type="button"
                          onClick={() => toggleSort("pulse_avg_recommend")}
                          className="hover:text-gold"
                        >
                          Avg rec. {sortKey === "pulse_avg_recommend" ? (sortDesc ? "↓" : "↑") : ""}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    {sortedArticles.map((row) => (
                      <tr key={row.publication_id} className="hover:bg-surface/50">
                        <td className="p-3 min-w-[200px]">
                          <Link
                            to="/p/$slug"
                            params={{ slug: row.slug }}
                            target="_blank"
                            className="font-medium hover:text-gold transition-colors"
                          >
                            {row.title}
                          </Link>
                          <div className="mt-1 text-xs text-text-secondary">
                            {TYPE_LABELS[row.type] ?? row.type}
                            {row.publication_date && (
                              <> · {formatDate(row.publication_date)}</>
                            )}
                          </div>
                        </td>
                        <td className="p-3 tabular-nums">{row.views.toLocaleString()}</td>
                        <td className="p-3 tabular-nums">{row.likes.toLocaleString()}</td>
                        <td className="p-3 tabular-nums">{row.comments}</td>
                        <td className="p-3 tabular-nums">{row.pulse_count}</td>
                        <td className="p-3 tabular-nums">
                          {row.pulse_count > 0 ? row.pulse_avg_recommend.toFixed(1) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {isAdmin && (data?.subscribers_by_month.length ?? 0) > 0 && (
            <section>
              <h2 className="font-serif text-xl mb-4">Subscriber sign-ups by month</h2>
              <ul className="divide-y divide-divider border border-divider max-w-md">
                {data!.subscribers_by_month.map((row) => (
                  <li key={row.month} className="p-3 flex justify-between text-sm bg-surface">
                    <span>{row.month}</span>
                    <span className="text-text-secondary tabular-nums">{row.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {isAdmin && data?.inquiries_by_type && Object.keys(data.inquiries_by_type).length > 0 && (
            <section>
              <h2 className="font-serif text-xl mb-4">Inquiries by type</h2>
              <ul className="divide-y divide-divider border border-divider max-w-md">
                {Object.entries(data.inquiries_by_type).map(([type, count]) => (
                  <li key={type} className="p-3 flex justify-between text-sm bg-surface">
                    <span>{INQUIRY_TYPE_LABELS[type as keyof typeof INQUIRY_TYPE_LABELS] ?? type}</span>
                    <span className="text-text-secondary tabular-nums">{count}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  );
}
