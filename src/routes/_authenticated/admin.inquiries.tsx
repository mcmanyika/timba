import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminPageHeader } from "@/components/admin/AdminLayout";
import {
  INQUIRY_STATUS_LABELS,
  INQUIRY_TYPE_LABELS,
  listInquiries,
  updateInquiryStatus,
  type InquiryStatus,
} from "@/lib/firebase/inquiries";

export const Route = createFileRoute("/_authenticated/admin/inquiries")({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) throw redirect({ to: "/admin" });
  },
  component: Inquiries,
});

const selectCls =
  "bg-surface border border-divider px-2 py-1 text-xs text-foreground focus:outline-none focus:border-gold";

function Inquiries() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["inquiries"],
    queryFn: listInquiries,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InquiryStatus }) =>
      updateInquiryStatus(id, status),
    onSuccess: () => {
      setError(null);
      qc.invalidateQueries({ queryKey: ["inquiries"] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to update status");
    },
  });

  function exportCsv() {
    const rows = data ?? [];
    const csv = [
      "name,email,type,status,organization,message,source,created_at",
      ...rows.map((r) =>
        [
          r.name,
          r.email,
          r.inquiry_type,
          r.status,
          r.organization ?? "",
          r.message,
          r.source_page ?? "",
          r.created_at,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timba-papers-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <AdminPageHeader
        title={`${data?.length ?? 0} inquiries`}
        description="Contact requests captured by the site assistant."
        actions={
          <button
            onClick={exportCsv}
            className="bg-gold text-background px-5 py-2 text-xs uppercase tracking-wider hover:bg-gold/90 transition-colors"
          >
            Export CSV
          </button>
        }
      />

      {error && <p className="mb-6 text-destructive text-sm">{error}</p>}

      {isLoading ? (
        <p className="text-text-secondary text-sm">Loading inquiries…</p>
      ) : (
        <div className="space-y-6">
          {(data ?? []).map((row) => (
            <article key={row.id} className="border border-divider p-5 bg-surface">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{row.name}</p>
                  <a href={`mailto:${row.email}`} className="text-sm text-gold hover:underline">
                    {row.email}
                  </a>
                  {row.organization && (
                    <p className="text-sm text-text-secondary mt-1">{row.organization}</p>
                  )}
                  {row.phone && (
                    <p className="text-sm text-text-secondary">{row.phone}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary uppercase tracking-wider">
                    {INQUIRY_TYPE_LABELS[row.inquiry_type]}
                  </span>
                  <select
                    value={row.status}
                    disabled={updateStatus.isPending}
                    onChange={(e) =>
                      updateStatus.mutate({
                        id: row.id,
                        status: e.target.value as InquiryStatus,
                      })
                    }
                    className={selectCls}
                    aria-label={`Status for ${row.name}`}
                  >
                    {(Object.keys(INQUIRY_STATUS_LABELS) as InquiryStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {INQUIRY_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {row.summary && (
                <p className="mt-3 text-sm text-text-secondary italic">{row.summary}</p>
              )}
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{row.message}</p>
              <p className="mt-3 text-xs text-text-secondary">
                {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                {row.source_page ? ` · ${row.source_page}` : ""}
              </p>
            </article>
          ))}
          {(data?.length ?? 0) === 0 && (
            <p className="text-text-secondary text-sm">No inquiries yet.</p>
          )}
        </div>
      )}
    </>
  );
}
