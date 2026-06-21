import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminPageHeader } from "@/components/admin/AdminLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getFirebaseAuth } from "@/integrations/firebase/client";
import {
  ADMIN_COMMENTS_QUERY_KEY,
  fetchAdminComments,
} from "@/lib/api/comments.functions";
import { formatDate } from "@/lib/categories";
import {
  COMMENT_STATUS_LABELS,
  deleteComment,
  updateCommentStatus,
  type CommentStatus,
} from "@/lib/firebase/comments";

export const Route = createFileRoute("/_authenticated/admin/comments")({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin && !context.editorAccess) throw redirect({ to: "/admin" });
  },
  component: AdminComments,
});

const selectCls =
  "bg-surface border border-divider px-2 py-1 text-xs text-foreground focus:outline-none focus:border-gold";

async function loadAdminComments() {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Not signed in");
  const idToken = await user.getIdToken(true);
  return fetchAdminComments({ data: { idToken } });
}

function AdminComments() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CommentStatus | "all">("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; preview: string } | null>(null);

  const { data, isLoading, isError, error: queryError, refetch, isFetching } = useQuery({
    queryKey: ADMIN_COMMENTS_QUERY_KEY,
    queryFn: loadAdminComments,
    retry: 1,
  });

  const mutate = useMutation({
    mutationFn: async ({
      id,
      action,
      status,
    }: {
      id: string;
      action: "status" | "delete";
      status?: CommentStatus;
    }) => {
      if (action === "delete") {
        await deleteComment(id);
      } else if (status) {
        await updateCommentStatus(id, status);
      }
    },
    onSuccess: () => {
      setError(null);
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ADMIN_COMMENTS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ["comments"] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Action failed");
    },
  });

  const rows = (data ?? []).filter((c) => filter === "all" || c.status === filter);
  const pendingCount = (data ?? []).filter((c) => c.status === "pending").length;
  const loading = isLoading || (isFetching && !data);

  return (
    <>
      <AdminPageHeader
        title="Comments"
        description={
          pendingCount > 0
            ? `${pendingCount} comment${pendingCount === 1 ? "" : "s"} awaiting review.`
            : "Reader comments on publications."
        }
        actions={
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as CommentStatus | "all")}
            className={selectCls}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        }
      />

      {error && <p className="text-destructive text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-text-secondary text-sm">Loading…</p>
      ) : isError ? (
        <div className="space-y-3">
          <p className="text-destructive text-sm">
            Could not load comments.{" "}
            {queryError instanceof Error ? queryError.message : "Please try again."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-gold text-sm hover:underline"
          >
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-text-secondary text-sm">No comments{filter !== "all" ? ` (${filter})` : ""}.</p>
      ) : (
        <ul className="divide-y divide-divider border border-divider">
          {rows.map((c) => (
            <li key={c.id} className="p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{c.author_name}</div>
                  <div className="text-xs text-text-secondary mt-0.5">
                    {c.author_email}
                    {c.created_at && <> · {formatDate(c.created_at)}</>}
                  </div>
                </div>
                <span
                  className={
                    c.status === "approved"
                      ? "text-gold text-xs uppercase tracking-wider"
                      : c.status === "pending"
                        ? "text-text-secondary text-xs uppercase tracking-wider"
                        : "text-destructive text-xs uppercase tracking-wider"
                  }
                >
                  {COMMENT_STATUS_LABELS[c.status]}
                </span>
              </div>

              <p className="text-sm leading-relaxed whitespace-pre-wrap">{c.body}</p>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <Link
                  to="/p/$slug"
                  params={{ slug: c.publication_slug }}
                  className="text-gold hover:underline"
                  target="_blank"
                >
                  {c.publication_title || c.publication_slug}
                </Link>
                {c.status === "pending" && (
                  <>
                    <button
                      onClick={() => mutate.mutate({ id: c.id, action: "status", status: "approved" })}
                      className="text-gold hover:underline"
                      disabled={mutate.isPending}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => mutate.mutate({ id: c.id, action: "status", status: "rejected" })}
                      className="text-text-secondary hover:text-foreground"
                      disabled={mutate.isPending}
                    >
                      Reject
                    </button>
                  </>
                )}
                {c.status === "approved" && (
                  <button
                    onClick={() => mutate.mutate({ id: c.id, action: "status", status: "rejected" })}
                    className="text-text-secondary hover:text-foreground"
                    disabled={mutate.isPending}
                  >
                    Hide
                  </button>
                )}
                {c.status === "rejected" && (
                  <button
                    onClick={() => mutate.mutate({ id: c.id, action: "status", status: "approved" })}
                    className="text-gold hover:underline"
                    disabled={mutate.isPending}
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() =>
                    setDeleteTarget({
                      id: c.id,
                      preview: c.body.length > 60 ? `${c.body.slice(0, 60)}…` : c.body,
                    })
                  }
                  className="text-destructive hover:underline"
                  disabled={mutate.isPending}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="border-divider bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl">Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will permanently remove “${deleteTarget.preview}”. This cannot be undone.`
                : "This will permanently remove this comment. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="border-divider bg-surface hover:bg-surface/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={mutate.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                mutate.mutate({ id: deleteTarget.id, action: "delete" });
              }}
            >
              {mutate.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
