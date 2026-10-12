import {
  collection,
  getDocs,
  getServerFirestore,
  orderBy,
  query,
  where,
} from "@/lib/firebase/server-client.server";

const COLLECTION = "publications";

export type PressStatementArticle = {
  id: string;
  publication_number: string;
  title: string;
  slug: string;
  url: string;
  excerpt: string | null;
  body: string | null;
  publication_date: string;
  pdf_url: string | null;
};

function docToArticle(
  id: string,
  data: Record<string, unknown>,
  origin: string,
): PressStatementArticle {
  const slug = String(data.slug ?? "");
  return {
    id,
    publication_number: String(data.publication_number ?? ""),
    title: String(data.title ?? ""),
    slug,
    url: `${origin}/p/${slug}`,
    excerpt: (data.excerpt as string | null) ?? null,
    body: (data.body as string | null) ?? null,
    publication_date: String(data.publication_date ?? ""),
    pdf_url: (data.pdf_url as string | null) ?? null,
  };
}

export async function listPublishedPressStatements(
  origin: string,
): Promise<PressStatementArticle[]> {
  const db = getServerFirestore();
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where("published", "==", true),
      where("type", "==", "press_statement"),
      orderBy("publication_date", "desc"),
    ),
  );
  return snap.docs.map((d) =>
    docToArticle(d.id, d.data() as Record<string, unknown>, origin),
  );
}
