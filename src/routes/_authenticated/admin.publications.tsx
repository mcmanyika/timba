import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { TYPE_LABELS, CATEGORY_LABELS, formatDate, type Publication } from "@/lib/categories";
import {
  deletePublication,
  listAllPublications,
  setFeaturedPublication,
  setPublicationPublished,
} from "@/lib/firebase/publications";

export const Route = createFileRoute("/_authenticated/admin/publications")({
  component: Publications,
});

function Publications() {
  const [deleteTarget, setDeleteTarget] = useState<Publication | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: pubs, refetch } = useQuery({
    queryKey: ["admin-pubs"],
    queryFn: listAllPublications,
    staleTime: 30_000,
  });

  async function togglePublish(p: Publication) {
    await setPublicationPublished(p.id, !p.published);
    refetch();
  }
  async function setFeatured(p: Publication) {
    await setFeaturedPublication(p.id);
    refetch();
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePublication(deleteTarget.id);
      setDeleteTarget(null);
      refetch();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Publications"
        description="Manage essays, policy papers, speeches, books, and media."
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

      <table className="w-full text-sm">
        <thead className="text-left text-text-secondary uppercase tracking-wider text-xs">
          <tr>
            <th className="py-3 pr-4">Number</th>
            <th className="py-3 pr-4">Title</th>
            <th className="py-3 pr-4">Type</th>
            <th className="py-3 pr-4">Category</th>
            <th className="py-3 pr-4">Date</th>
            <th className="py-3 pr-4">Status</th>
            <th className="py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-divider">
          {(pubs ?? []).map((p) => (
            <tr key={p.id} className="align-top">
              <td className="py-4 pr-4 pub-number">{p.publication_number}</td>
              <td className="py-4 pr-4">
                <Link
                  to="/admin/editor/$id"
                  params={{ id: p.id }}
                  className="hover:text-gold font-serif text-base"
                >
                  {p.title}
                </Link>
                {p.is_featured && <span className="ml-2 text-xs text-gold">★ Featured</span>}
              </td>
              <td className="py-4 pr-4 text-text-secondary">{TYPE_LABELS[p.type]}</td>
              <td className="py-4 pr-4 text-text-secondary">
                {p.category ? CATEGORY_LABELS[p.category] : "—"}
              </td>
              <td className="py-4 pr-4 text-text-secondary">
                {formatDate(p.publication_date)}
              </td>
              <td className="py-4 pr-4">
                <span className={p.published ? "text-gold" : "text-text-secondary"}>
                  {p.published ? "Published" : "Draft"}
                </span>
              </td>
              <td className="py-4 space-x-3 text-xs">
                <button
                  onClick={() => togglePublish(p)}
                  className="text-text-secondary hover:text-gold"
                >
                  {p.published ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => setFeatured(p)}
                  className="text-text-secondary hover:text-gold"
                >
                  Feature
                </button>
                <button onClick={() => setDeleteTarget(p)} className="text-destructive">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
        title="Delete publication?"
        description={
          deleteTarget
            ? `This will permanently remove “${deleteTarget.title}”. This cannot be undone.`
            : "This will permanently remove this publication. This cannot be undone."
        }
        confirmLabel={deleting ? "Deleting" : "Delete"}
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </>
  );
}
