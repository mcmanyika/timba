import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/SiteShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/subscribers")({
  component: Subs,
});

interface Subscriber {
  id: string;
  first_name: string;
  email: string;
  source: string | null;
  created_at: string;
}

function Subs() {
  const { data } = useQuery({
    queryKey: ["subs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Subscriber[];
    },
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
    <SiteShell>
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12">
        <div className="flex items-center justify-between border-b border-divider pb-6">
          <div>
            <div className="pub-number">Subscribers</div>
            <h1 className="mt-2 font-serif text-3xl">{data?.length ?? 0} subscribers</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-text-secondary text-sm hover:text-gold">
              ← Back
            </Link>
            <button
              onClick={exportCsv}
              className="bg-gold text-background px-5 py-2 text-xs uppercase tracking-wider"
            >
              Export CSV
            </button>
          </div>
        </div>
        <table className="w-full mt-8 text-sm">
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
      </div>
    </SiteShell>
  );
}