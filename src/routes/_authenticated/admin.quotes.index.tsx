import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { PUBLIC_QUOTES_QUERY_KEY } from "@/lib/api/quotes.functions";
import { deleteQuote, listAllQuotes, setQuotePublished } from "@/lib/firebase/quotes";

export const Route = createFileRoute("/_authenticated/admin/quotes/")({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) throw redirect({ to: "/admin" });
  },
  component: AdminQuotes,
});

function AdminQuotes() {
  const qc = useQueryClient();
  const { data, refetch } = useQuery({
    queryKey: ["admin-quotes"],
    queryFn: listAllQuotes,
  });

  async function invalidatePublicQuotes() {
    await qc.invalidateQueries({ queryKey: PUBLIC_QUOTES_QUERY_KEY });
  }

  async function togglePublish(id: string, published: boolean) {
    await setQuotePublished(id, !published);
    await invalidatePublicQuotes();
    refetch();
  }

  async function remove(id: string, text: string) {
    const preview = text.length > 60 ? `${text.slice(0, 60)}…` : text;
    if (!confirm(`Delete quote “${preview}”?`)) return;
    await deleteQuote(id);
    await invalidatePublicQuotes();
    refetch();
  }

  return (
    <>
      <AdminPageHeader
        title="Quotes"
        description="Publish quotations for the public Quotes page. Admin only."
        actions={
          <Link
            to="/admin/quotes/$id"
            params={{ id: "new" }}
            className="bg-gold text-background px-5 py-2 text-xs uppercase tracking-wider hover:bg-gold/90 transition-colors"
          >
            New quote
          </Link>
        }
      />

      <table className="w-full text-sm">
        <thead className="text-left text-text-secondary uppercase tracking-wider text-xs">
          <tr>
            <th className="py-3 pr-4">Quote</th>
            <th className="py-3 pr-4">Attribution</th>
            <th className="py-3 pr-4">Status</th>
            <th className="py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-divider">
          {(data ?? []).map((q) => (
            <tr key={q.id} className="align-top">
              <td className="py-4 pr-4 max-w-md">
                <Link
                  to="/admin/quotes/$id"
                  params={{ id: q.id }}
                  className="hover:text-gold font-serif text-base line-clamp-3"
                >
                  “{q.text}”
                </Link>
              </td>
              <td className="py-4 pr-4 text-text-secondary">{q.attribution ?? "—"}</td>
              <td className="py-4 pr-4">
                <span className={q.published ? "text-gold" : "text-text-secondary"}>
                  {q.published ? "Published" : "Draft"}
                </span>
              </td>
              <td className="py-4 space-x-3 text-xs whitespace-nowrap">
                <button
                  onClick={() => togglePublish(q.id, q.published)}
                  className="text-text-secondary hover:text-gold"
                >
                  {q.published ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => remove(q.id, q.text)}
                  className="text-destructive"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {(data?.length ?? 0) === 0 && (
        <p className="text-text-secondary text-sm mt-6">No quotes yet.</p>
      )}
    </>
  );
}
