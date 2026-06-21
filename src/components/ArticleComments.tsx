import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";

import { formatDate } from "@/lib/categories";
import {
  listApprovedComments,
  submitComment,
} from "@/lib/firebase/comments";

function articleCommentsQueryKey(publicationId: string) {
  return ["comments", publicationId] as const;
}

const schema = z.object({
  author_name: z.string().trim().min(1, "Name required").max(100),
  author_email: z.string().trim().email("Invalid email").max(255),
  body: z.string().trim().min(1, "Comment required").max(2000),
});

const inputCls =
  "w-full bg-background border border-divider px-4 py-3 text-foreground placeholder:text-text-secondary focus:outline-none focus:border-gold transition-colors";

export function ArticleComments({
  publicationId,
  publicationSlug,
  publicationTitle,
}: {
  publicationId: string;
  publicationSlug: string;
  publicationTitle: string;
}) {
  const qc = useQueryClient();
  const queryKey = articleCommentsQueryKey(publicationId);

  const { data: comments, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => listApprovedComments(publicationId),
    retry: 1,
  });

  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      author_name: authorName,
      author_email: authorEmail,
      body,
    });
    if (!parsed.success) {
      setState("error");
      setMsg(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setState("loading");
    try {
      await submitComment({
        publication_id: publicationId,
        publication_slug: publicationSlug,
        publication_title: publicationTitle,
        author_name: parsed.data.author_name,
        author_email: parsed.data.author_email,
        body: parsed.data.body,
      });
      setState("done");
      setMsg("Thank you. Your comment will appear after editorial review.");
      setAuthorName("");
      setAuthorEmail("");
      setBody("");
      qc.invalidateQueries({ queryKey });
    } catch {
      setState("error");
      setMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <section className="border-t border-divider pt-12">
      <div className="pub-number">Discussion</div>
      <h2 className="mt-3 font-serif text-2xl md:text-3xl">Comments</h2>
      <p className="mt-2 text-text-secondary text-sm max-w-xl">
        Share your thoughts. Comments are reviewed before they appear publicly.
      </p>

      {isLoading ? (
        <p className="mt-8 text-text-secondary text-sm">Loading comments…</p>
      ) : isError ? (
        <p className="mt-8 text-destructive text-sm">Could not load comments.</p>
      ) : (comments?.length ?? 0) === 0 ? (
        <p className="mt-8 text-text-secondary text-sm">No comments yet. Be the first to respond.</p>
      ) : (
        <ul className="mt-8 space-y-8">
          {comments!.map((c) => (
            <li key={c.id} className="border-l-2 border-divider pl-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-medium text-foreground">{c.author_name}</span>
                {c.created_at && (
                  <time className="text-xs text-text-secondary" dateTime={c.created_at}>
                    {formatDate(c.created_at)}
                  </time>
                )}
              </div>
              <p className="mt-2 text-foreground leading-relaxed whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onSubmit} className="mt-10 space-y-4 max-w-2xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            aria-label="Your name"
            placeholder="Your name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className={inputCls}
            disabled={state === "loading"}
          />
          <input
            aria-label="Email"
            type="email"
            placeholder="Email (not published)"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            className={inputCls}
            disabled={state === "loading"}
          />
        </div>
        <textarea
          aria-label="Comment"
          placeholder="Your comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={2000}
          className={inputCls}
          disabled={state === "loading"}
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="bg-gold text-background px-6 py-3 text-xs uppercase tracking-wider hover:bg-gold/90 transition-colors disabled:opacity-60"
        >
          {state === "loading" ? "Submitting…" : "Submit comment"}
        </button>
        {msg && (
          <p className={`text-sm ${state === "error" ? "text-destructive" : "text-gold"}`}>{msg}</p>
        )}
      </form>
    </section>
  );
}
