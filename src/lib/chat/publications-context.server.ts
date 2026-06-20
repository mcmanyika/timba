import { collection, getDocs, getServerFirestore, limit, orderBy, query, where } from "@/lib/firebase/server-client.server";

export interface PublicationSnippet {
  title: string;
  slug: string;
  type: string;
  category: string | null;
  excerpt: string | null;
  publication_date: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function toSnippet(id: string, data: Record<string, unknown>): PublicationSnippet {
  const rawBody = data.body ? stripHtml(String(data.body)).slice(0, 400) : null;
  const excerpt = data.excerpt ? String(data.excerpt) : rawBody;
  return {
    title: String(data.title ?? ""),
    slug: String(data.slug ?? id),
    type: String(data.type ?? "essay"),
    category: (data.category as string | null) ?? null,
    excerpt,
    publication_date: String(data.publication_date ?? ""),
  };
}

function scorePublication(pub: PublicationSnippet, terms: string[]): number {
  const haystack = [pub.title, pub.excerpt ?? "", pub.category ?? "", pub.type]
    .join(" ")
    .toLowerCase();
  return terms.reduce((score, term) => (haystack.includes(term) ? score + 1 : score), 0);
}

/** Fetch published publications relevant to the user's message for RAG-lite context. */
export async function getRelevantPublications(userMessage: string, max = 5): Promise<PublicationSnippet[]> {
  const db = getServerFirestore();
  const snap = await getDocs(
    query(
      collection(db, "publications"),
      where("published", "==", true),
      orderBy("publication_date", "desc"),
      limit(40),
    ),
  );

  const pubs = snap.docs.map((d) => toSnippet(d.id, d.data() as Record<string, unknown>));
  const terms = userMessage
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);

  if (terms.length === 0) return pubs.slice(0, max);

  const ranked = pubs
    .map((pub) => ({ pub, score: scorePublication(pub, terms) }))
    .sort((a, b) => b.score - a.score || b.pub.publication_date.localeCompare(a.pub.publication_date));

  const matches = ranked.filter((r) => r.score > 0).map((r) => r.pub);
  return (matches.length > 0 ? matches : pubs).slice(0, max);
}

export function formatPublicationsForPrompt(pubs: PublicationSnippet[]): string {
  if (pubs.length === 0) return "No published publications indexed yet.";
  return pubs
    .map(
      (p) =>
        `- "${p.title}" (${p.type}, ${p.publication_date}) — /p/${p.slug}\n  ${p.excerpt?.slice(0, 220) ?? ""}`,
    )
    .join("\n");
}
