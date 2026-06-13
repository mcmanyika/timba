import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicationCard } from "@/components/PublicationCard";
import { CATEGORY_LABELS, type Publication } from "@/lib/categories";

interface Props {
  title: string;
  description?: string;
  type?: string | string[];
  categories?: readonly string[];
  showSearch?: boolean;
}

export function ArchiveView({ title, description, type, categories, showSearch = true }: Props) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["archive", type, categories],
    queryFn: async () => {
      let q = supabase
        .from("publications")
        .select("*")
        .eq("published", true)
        .order("publication_date", { ascending: false });
      if (type) {
        if (Array.isArray(type)) q = q.in("type", type as any);
        else q = q.eq("type", type as any);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as Publication[];
    },
  });

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (cat !== "all") list = list.filter((p) => p.category === cat);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          p.body?.toLowerCase().includes(q) ||
          p.publication_number.toLowerCase().includes(q),
      );
    }
    return list;
  }, [data, cat, query]);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
      <div className="border-b border-divider pb-10">
        <div className="pub-number">{title}</div>
        <h1 className="mt-3 font-serif text-5xl md:text-6xl tracking-tight">{title}</h1>
        {description && (
          <p className="mt-6 text-text-secondary max-w-2xl text-lg leading-relaxed">{description}</p>
        )}
      </div>

      {showSearch && (
        <div className="mt-10 flex flex-col gap-4">
          <input
            placeholder="Search by title, keyword, or publication number…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-surface border border-divider px-4 py-3 text-foreground placeholder:text-text-secondary focus:outline-none focus:border-gold"
          />
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <FilterChip active={cat === "all"} onClick={() => setCat("all")}>
                All
              </FilterChip>
              {categories.map((c) => (
                <FilterChip key={c} active={cat === c} onClick={() => setCat(c)}>
                  {CATEGORY_LABELS[c]}
                </FilterChip>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 border-t border-divider animate-pulse" />
            ))
          : filtered.map((p) => <PublicationCard key={p.id} p={p} />)}
      </div>
      {!isLoading && filtered.length === 0 && (
        <p className="mt-12 text-text-secondary">No publications match your filter.</p>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs uppercase tracking-wider px-3 py-2 border transition-colors ${
        active
          ? "border-gold text-gold"
          : "border-divider text-text-secondary hover:text-foreground hover:border-foreground"
      }`}
    >
      {children}
    </button>
  );
}