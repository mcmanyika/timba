import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { PUBLIC_QUOTES_QUERY_KEY } from "@/lib/api/quotes.functions";
import { createQuote, getQuoteById, updateQuote } from "@/lib/firebase/quotes";

export const Route = createFileRoute("/_authenticated/admin/quotes/$id")({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) throw redirect({ to: "/admin" });
  },
  component: QuoteEditor,
});

const inputCls =
  "w-full bg-surface border border-divider px-4 py-3 text-foreground focus:outline-none focus:border-gold transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="pub-number">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function QuoteEditor() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    text: "",
    attribution: isNew ? "Jameson Timba" : "",
    source_url: "",
    published: false,
  });

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getQuoteById(id);
        if (cancelled) return;
        if (!data) {
          setError("Quote not found.");
          return;
        }
        setForm({
          text: data.text,
          attribution: data.attribution ?? "",
          source_url: data.source_url ?? "",
          published: data.published,
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load quote");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.text.trim()) {
      setError("Quote text is required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = {
        text: form.text,
        attribution: form.attribution || null,
        source_url: form.source_url || null,
        published: form.published,
      };
      if (isNew) {
        const created = await createQuote(payload);
        await qc.invalidateQueries({ queryKey: PUBLIC_QUOTES_QUERY_KEY });
        await nav({ to: "/admin/quotes/$id", params: { id: created.id }, replace: true });
      } else {
        await updateQuote(id, payload);
        await qc.invalidateQueries({ queryKey: PUBLIC_QUOTES_QUERY_KEY });
        await nav({ to: "/admin/quotes", replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save quote");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-text-secondary text-sm">Loading…</p>;
  }

  return (
    <>
      <AdminPageHeader
        title={isNew ? "New quote" : "Edit quote"}
        actions={
          <Link to="/admin/quotes" className="text-sm text-text-secondary hover:text-gold">
            ← All quotes
          </Link>
        }
      />

      <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
        <Field label="Quote">
          <textarea
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            rows={5}
            required
            className={inputCls}
            placeholder="The quotation text…"
          />
        </Field>

        <Field label="Attribution (optional)">
          <input
            value={form.attribution}
            onChange={(e) => setForm({ ...form, attribution: e.target.value })}
            placeholder="Jameson Timba — speech, 2025"
            className={inputCls}
          />
        </Field>

        <Field label="Source URL (optional)">
          <input
            type="url"
            value={form.source_url}
            onChange={(e) => setForm({ ...form, source_url: e.target.value })}
            placeholder="https://…"
            className={inputCls}
          />
        </Field>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="size-4 accent-gold"
          />
          <span className="text-sm">Published on /quotes</span>
        </label>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-gold text-background px-6 py-3 text-xs uppercase tracking-wider hover:bg-gold/90 transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save quote"}
          </button>
          <Link to="/admin/quotes" className="text-sm text-text-secondary hover:text-gold">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
