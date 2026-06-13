import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { TYPE_LABELS, CATEGORY_LABELS, formatDate, type Publication } from "@/lib/categories";

export const Route = createFileRoute("/_authenticated/admin")({
  component: Admin,
});

function Admin() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setEmail(u.user?.email ?? "");
      if (!u.user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id);
      setIsAdmin(!!data?.some((r) => r.role === "admin" || r.role === "editor"));
    })();
  }, []);

  const { data: pubs, refetch } = useQuery({
    queryKey: ["admin-pubs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("publications")
        .select("*")
        .order("publication_date", { ascending: false });
      if (error) throw error;
      return data as Publication[];
    },
    enabled: isAdmin === true,
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }

  async function togglePublish(p: Publication) {
    await supabase.from("publications").update({ published: !p.published }).eq("id", p.id);
    refetch();
  }
  async function setFeatured(p: Publication) {
    await supabase.from("publications").update({ is_featured: false }).neq("id", p.id);
    await supabase.from("publications").update({ is_featured: true }).eq("id", p.id);
    refetch();
  }
  async function remove(p: Publication) {
    if (!confirm(`Delete "${p.title}"?`)) return;
    await supabase.from("publications").delete().eq("id", p.id);
    refetch();
  }

  if (isAdmin === null) {
    return (
      <SiteShell>
        <div className="max-w-6xl mx-auto px-6 py-20 text-text-secondary">Loading…</div>
      </SiteShell>
    );
  }

  if (!isAdmin) {
    return (
      <SiteShell>
        <div className="max-w-2xl mx-auto px-6 py-20">
          <div className="pub-number">Restricted</div>
          <h1 className="mt-3 font-serif text-4xl">Admin access required</h1>
          <p className="mt-4 text-text-secondary">
            You are signed in as <span className="text-foreground">{email}</span> but this
            account does not have admin or editor privileges. A database administrator
            must grant you a role by inserting a row into <code>user_roles</code>.
          </p>
          <button onClick={signOut} className="mt-6 text-gold text-sm">
            Sign out →
          </button>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="flex items-center justify-between border-b border-divider pb-6">
          <div>
            <div className="pub-number">Editorial Desk</div>
            <h1 className="mt-2 font-serif text-3xl">Publications</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/admin/subscribers"
              className="text-sm text-text-secondary hover:text-gold"
            >
              Subscribers →
            </Link>
            <Link
              to="/admin/editor/$id"
              params={{ id: "new" }}
              className="bg-gold text-background px-5 py-2 text-xs uppercase tracking-wider"
            >
              New publication
            </Link>
            <button onClick={signOut} className="text-text-secondary text-sm hover:text-gold">
              Sign out
            </button>
          </div>
        </div>

        <table className="w-full mt-8 text-sm">
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
                  {p.is_featured && (
                    <span className="ml-2 text-xs text-gold">★ Featured</span>
                  )}
                </td>
                <td className="py-4 pr-4 text-text-secondary">{TYPE_LABELS[p.type]}</td>
                <td className="py-4 pr-4 text-text-secondary">
                  {p.category ? CATEGORY_LABELS[p.category] : "—"}
                </td>
                <td className="py-4 pr-4 text-text-secondary">
                  {formatDate(p.publication_date)}
                </td>
                <td className="py-4 pr-4">
                  <span
                    className={
                      p.published ? "text-gold" : "text-text-secondary"
                    }
                  >
                    {p.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="py-4 space-x-3 text-xs">
                  <button onClick={() => togglePublish(p)} className="text-text-secondary hover:text-gold">
                    {p.published ? "Unpublish" : "Publish"}
                  </button>
                  <button onClick={() => setFeatured(p)} className="text-text-secondary hover:text-gold">
                    Feature
                  </button>
                  <button onClick={() => remove(p)} className="text-destructive">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SiteShell>
  );
}