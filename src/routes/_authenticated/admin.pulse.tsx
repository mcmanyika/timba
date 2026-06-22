import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AdminPageHeader } from "@/components/admin/AdminLayout";
import {
  ADMIN_PULSE_QUERY_KEY,
  fetchAdminArticlePulses,
} from "@/lib/api/pulse.functions";
import { getFirebaseAuth } from "@/integrations/firebase/client";
import {
  aggregateArticlePulses,
  PERSPECTIVE_LABELS,
} from "@/lib/firebase/article-pulse";

export const Route = createFileRoute("/_authenticated/admin/pulse")({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin && !context.editorAccess) throw redirect({ to: "/admin" });
  },
  component: AdminPulse,
});

async function loadAdminPulses() {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Not signed in");
  const idToken = await user.getIdToken(true);
  return fetchAdminArticlePulses({ data: { idToken } });
}

function pct(part: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function AdminPulse() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ADMIN_PULSE_QUERY_KEY,
    queryFn: loadAdminPulses,
    retry: 1,
    refetchOnMount: "always",
  });

  const aggregates = aggregateArticlePulses(data ?? []);
  const totalResponses = data?.length ?? 0;
  const loading = isLoading || (isFetching && !data);

  return (
    <>
      <AdminPageHeader
        title={`${totalResponses} reader pulse${totalResponses === 1 ? "" : "s"}`}
        description="Anonymous after-read feedback — shown when readers reach ~80% of an article."
        actions={
          <button
            type="button"
            onClick={() => refetch()}
            disabled={loading}
            className="border border-divider px-4 py-2 text-xs uppercase tracking-wider text-text-secondary hover:border-gold hover:text-gold transition-colors disabled:opacity-60"
          >
            Refresh
          </button>
        }
      />

      {isError && (
        <p className="mb-6 text-destructive text-sm">
          Could not load reader pulse data.{" "}
          {error instanceof Error ? error.message : "Please try again."}
        </p>
      )}

      {loading ? (
        <p className="text-text-secondary text-sm">Loading reader pulse…</p>
      ) : totalResponses === 0 ? (
        <p className="text-text-secondary text-sm">No reader pulse responses yet.</p>
      ) : (
        <div className="space-y-8">
          {aggregates.map((row) => (
            <article key={row.publication_id} className="border border-divider p-5 md:p-6 bg-surface">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    to="/p/$slug"
                    params={{ slug: row.publication_slug }}
                    className="font-serif text-xl hover:text-gold transition-colors"
                    target="_blank"
                  >
                    {row.publication_title}
                  </Link>
                  <p className="mt-1 text-xs text-text-secondary">
                    {row.total} response{row.total === 1 ? "" : "s"} · avg recommend{" "}
                    {row.avgRecommend.toFixed(1)}/5
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3 text-sm">
                <div className="border border-divider px-4 py-3">
                  <div className="text-xs uppercase tracking-wider text-text-secondary">
                    {PERSPECTIVE_LABELS.yes}
                  </div>
                  <div className="mt-1 font-medium">
                    {row.yes}{" "}
                    <span className="text-text-secondary font-normal">
                      ({pct(row.yes, row.total)})
                    </span>
                  </div>
                </div>
                <div className="border border-divider px-4 py-3">
                  <div className="text-xs uppercase tracking-wider text-text-secondary">
                    {PERSPECTIVE_LABELS.somewhat}
                  </div>
                  <div className="mt-1 font-medium">
                    {row.somewhat}{" "}
                    <span className="text-text-secondary font-normal">
                      ({pct(row.somewhat, row.total)})
                    </span>
                  </div>
                </div>
                <div className="border border-divider px-4 py-3">
                  <div className="text-xs uppercase tracking-wider text-text-secondary">
                    {PERSPECTIVE_LABELS.no}
                  </div>
                  <div className="mt-1 font-medium">
                    {row.no}{" "}
                    <span className="text-text-secondary font-normal">
                      ({pct(row.no, row.total)})
                    </span>
                  </div>
                </div>
              </div>

              {row.recentNotes.length > 0 && (
                <div className="mt-5">
                  <div className="text-xs uppercase tracking-wider text-text-secondary mb-2">
                    What’s missing
                  </div>
                  <ul className="space-y-2">
                    {row.recentNotes.map((note, i) => (
                      <li
                        key={`${note.created_at}-${i}`}
                        className="text-sm text-text-secondary border-l-2 border-gold/40 pl-3 italic"
                      >
                        “{note.note}”
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
