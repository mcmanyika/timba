import {
  collection,
  getDocs,
  getServerFirestore,
  orderBy,
  query,
  where,
} from "@/lib/firebase/server-client.server";

const COLLECTION = "publications";

export type PaperArticle = {
  id: string;
  type: string;
  publication_number: string;
  title: string;
  slug: string;
  url: string;
  excerpt: string | null;
  body: string | null;
  publication_date: string;
  pdf_url: string | null;
};

export async function listPublishedPapers(origin: string): Promise<PaperArticle[]> {
  const db = getServerFirestore();
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where("published", "==", true),
      orderBy("publication_date", "desc"),
    ),
  );

  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    const slug = String(data.slug ?? "");
    return {
      id: d.id,
      type: String(data.type ?? "essay"),
      publication_number: String(data.publication_number ?? ""),
      title: String(data.title ?? ""),
      slug,
      url: `${origin}/p/${slug}`,
      excerpt: (data.excerpt as string | null) ?? null,
      body: (data.body as string | null) ?? null,
      publication_date: String(data.publication_date ?? ""),
      pdf_url: (data.pdf_url as string | null) ?? null,
    };
  });
}
