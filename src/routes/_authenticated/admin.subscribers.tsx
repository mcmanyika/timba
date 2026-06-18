import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { listSubscribers } from "@/lib/firebase/subscribers";

export const Route = createFileRoute("/_authenticated/admin/subscribers")({
  component: Subscribers,
});

function Subscribers() {
  const { data } = useQuery({
    queryKey: ["subs"],
    queryFn: listSubscribers,
  });

  function exportCsv() {
    const rows = data ?? [];
    const csv = [
      "first_name,email,source,created_at",
      ...rows.map((r) =>
        [r.first_name, r.email, r.source ?? "", r.created_at]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timba-papers-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <AdminPageHeader
        title={`${data?.length ?? 0} subscribers`}
        description="Email list from the public subscribe form."
        actions={
          <button
            onClick={exportCsv}
            className="bg-gold text-background px-5 py-2 text-xs uppercase tracking-wider hover:bg-gold/90 transition-colors"
          >
            Export CSV
          </button>
        }
      />

      <table className="w-full text-sm">
        <thead className="text-left text-text-secondary uppercase tracking-wider text-xs">
          <tr>
            <th className="py-3 pr-4">Name</th>
            <th className="py-3 pr-4">Email</th>
            <th className="py-3 pr-4">Source</th>
            <th className="py-3">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-divider">
          {(data ?? []).map((s) => (
            <tr key={s.id}>
              <td className="py-3 pr-4">{s.first_name}</td>
              <td className="py-3 pr-4">{s.email}</td>
              <td className="py-3 pr-4 text-text-secondary">{s.source ?? "—"}</td>
              <td className="py-3 text-text-secondary">
                {new Date(s.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
