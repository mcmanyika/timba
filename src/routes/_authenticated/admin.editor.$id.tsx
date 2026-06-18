import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ALL_CATEGORIES, CATEGORY_LABELS } from "@/lib/categories";
import { isEmptyEditorHtml, normalizeBodyForEditor } from "@/lib/body-content";
import {
  createPublication,
  getPublicationById,
  updatePublication,
} from "@/lib/firebase/publications";

export const Route = createFileRoute("/_authenticated/admin/editor/$id")({
  component: Editor,
});

const TYPES = ["essay", "policy_paper", "speech", "book", "media"] as const;

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 100);
}

function Editor() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const isNew = id === "new";

  const [form, setForm] = useState({
    type: "essay",
    category: "constitution_democracy",
    title: "",
    slug: "",
    excerpt: "",
    body: "",
    location: "",
    occasion: "",
    featured_image_url: "",
    pdf_url: "",
    media_embed_url: "",
    publication_number: "",
    publication_date: new Date().toISOString().slice(0, 10),
    published: false,
    is_featured: false,
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const data = await getPublicationById(id);
      if (data) {
        setForm({
          type: data.type,
          category: data.category ?? "",
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt ?? "",
          body: normalizeBodyForEditor(data.body),
          location: data.location ?? "",
          occasion: data.occasion ?? "",
          featured_image_url: data.featured_image_url ?? "",
          pdf_url: data.pdf_url ?? "",
          media_embed_url: data.media_embed_url ?? "",
          publication_number: data.publication_number ?? "",
          publication_date: data.publication_date,
          published: data.published,
          is_featured: data.is_featured,
        });
      }
      setLoading(false);
    })();
  }, [id, isNew]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const payload = {
      type: form.type,
      category: form.category || null,
      title: form.title,
      slug: form.slug || slugify(form.title),
      excerpt: form.excerpt || null,
      body: isEmptyEditorHtml(form.body) ? null : form.body,
      location: form.location || null,
      occasion: form.occasion || null,
      featured_image_url: form.featured_image_url || null,
      pdf_url: form.pdf_url || null,
      media_embed_url: form.media_embed_url || null,
      publication_date: form.publication_date,
      published: form.published,
      is_featured: form.is_featured,
      publication_number: form.publication_number || undefined,
    };
    try {
      if (isNew) {
        await createPublication(payload);
      } else {
        await updatePublication(id, payload);
      }
      nav({ to: "/admin/publications" });
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Failed to save publication");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-text-secondary">Loading…</p>;
  }

  return (
    <>
      <AdminPageHeader
        title={isNew ? "New publication" : "Edit publication"}
        description={isNew ? undefined : form.publication_number || undefined}
        actions={
          <Link to="/admin/publications" className="text-sm text-text-secondary hover:text-gold">
            ← Back
          </Link>
        }
      />
      <form onSubmit={save} className="max-w-3xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className={inputCls}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputCls}
            >
              <option value="">— none —</option>
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Title">
          <input
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value,
                slug: form.slug || slugify(e.target.value),
              })
            }
            required
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Slug">
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
              className={inputCls}
            />
          </Field>
          <Field label="Publication date">
            <input
              type="date"
              value={form.publication_date}
              onChange={(e) => setForm({ ...form, publication_date: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Publication number (leave blank to auto-generate)">
          <input
            value={form.publication_number}
            onChange={(e) => setForm({ ...form, publication_number: e.target.value })}
            placeholder="TP-2026-001"
            className={inputCls}
          />
        </Field>

        <Field label="Excerpt">
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            rows={3}
            className={inputCls}
          />
        </Field>

        <Field label="Body">
          <RichTextEditor
            value={form.body}
            onChange={(html) => setForm({ ...form, body: html })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Location (for speeches)">
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Featured image URL">
            <input
              value={form.featured_image_url}
              onChange={(e) => setForm({ ...form, featured_image_url: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="PDF URL (policy papers)">
            <input
              value={form.pdf_url}
              onChange={(e) => setForm({ ...form, pdf_url: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Media embed URL (YouTube / audio)">
            <input
              value={form.media_embed_url}
              onChange={(e) => setForm({ ...form, media_embed_url: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Published
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            />
            Featured on homepage
          </label>
        </div>

        {err && <p className="text-destructive text-sm">{err}</p>}

        <div className="flex gap-3 pt-4 border-t border-divider">
          <button
            type="submit"
            disabled={saving}
            className="bg-gold text-background px-6 py-3 text-xs uppercase tracking-wider"
          >
            {saving ? "Saving…" : "Save publication"}
          </button>
          <Link
            to="/admin/publications"
            className="px-6 py-3 text-xs uppercase tracking-wider border border-divider"
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}

const inputCls =
  "w-full bg-surface border border-divider px-4 py-3 text-foreground focus:outline-none focus:border-gold";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-text-secondary mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}