import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { TYPE_LABELS, formatDate } from "@/lib/categories";
import { fetchDashboardStats } from "@/lib/firebase/dashboard";

const adminRoute = getRouteApi("/_authenticated/admin");

export const Route = createFileRoute("/_authenticated/admin/")({
  loader: async ({ context }) => {
    const isAdmin = Boolean((context as { isAdmin?: boolean }).isAdmin);
    return fetchDashboardStats(isAdmin);
  },
  component: Dashboard,
});

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string | number;
  loading?: boolean;
}) {
  return (
    <div className="border border-divider bg-surface p-5">
      <div className="pub-number">{label}</div>
      <div className={`mt-2 font-serif text-4xl ${loading ? "animate-pulse text-text-secondary" : ""}`}>
        {loading ? "—" : value}
      </div>
    </div>
  );
}

function Dashboard() {
  const { isAdmin } = adminRoute.useRouteContext();
  const loaderData = Route.useLoaderData();

  const { data: stats, isFetching } = useQuery({
    queryKey: ["dashboard-stats", isAdmin],
    queryFn: () => fetchDashboardStats(isAdmin),
    initialData: loaderData,
    staleTime: 60_000,
  });

  const loading = isFetching && !stats;

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of publications, drafts, and subscribers."
        actions={
          <Link
            to="/admin/editor/$id"
            params={{ id: "new" }}
            className="bg-gold text-background px-5 py-2 text-xs uppercase tracking-wider hover:bg-gold/90 transition-colors"
          >
            New publication
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={stats?.total ?? 0} loading={loading} />
        <StatCard label="Published" value={stats?.published ?? 0} loading={loading} />
        <StatCard label="Drafts" value={stats?.drafts ?? 0} loading={loading} />
        <StatCard
          label="Subscribers"
          value={isAdmin ? (stats?.subscribers ?? 0) : "—"}
          loading={loading && isAdmin}
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl">Recent updates</h2>
            <Link to="/admin/publications" className="text-xs text-gold uppercase tracking-wider">
              All →
            </Link>
          </div>
          <ul className="divide-y divide-divider border border-divider">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="p-4 h-14 animate-pulse bg-surface/50" />
              ))
            ) : (stats?.recent.length ?? 0) === 0 ? (
              <li className="p-4 text-text-secondary text-sm">No publications yet.</li>
            ) : (
              stats!.recent.map((p) => (
                <li key={p.id} className="p-4">
                  <Link
                    to="/admin/editor/$id"
                    params={{ id: p.id }}
                    className="font-serif hover:text-gold transition-colors"
                  >
                    {p.title}
                  </Link>
                  <div className="mt-1 text-xs text-text-secondary flex flex-wrap gap-2">
                    <span>{TYPE_LABELS[p.type]}</span>
                    <span>·</span>
                    <span>{p.published ? "Published" : "Draft"}</span>
                    <span>·</span>
                    <span>{formatDate(p.publication_date)}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl mb-4">By type</h2>
          <ul className="divide-y divide-divider border border-divider">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="p-4 h-10 animate-pulse bg-surface/50" />
              ))
            ) : Object.entries(stats?.byType ?? {}).length === 0 ? (
              <li className="p-4 text-text-secondary text-sm">No data yet.</li>
            ) : (
              Object.entries(stats!.byType).map(([type, count]) => (
                <li key={type} className="p-4 flex justify-between text-sm">
                  <span>{TYPE_LABELS[type] ?? type}</span>
                  <span className="text-text-secondary">{count}</span>
                </li>
              ))
            )}
          </ul>

          {!loading && (stats?.draftRecent.length ?? 0) > 0 && (
            <div className="mt-8">
              <h2 className="font-serif text-xl mb-4">Drafts</h2>
              <ul className="divide-y divide-divider border border-divider">
                {stats!.draftRecent.map((p) => (
                  <li key={p.id} className="p-4">
                    <Link
                      to="/admin/editor/$id"
                      params={{ id: p.id }}
                      className="text-sm hover:text-gold transition-colors"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
