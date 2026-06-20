import {
  collection,
  getDocs,
  getServerFirestore,
  limit,
  query,
  where,
} from "@/lib/firebase/server-client.server";
import type { Quote } from "@/lib/firebase/quotes";

const COLLECTION = "quotes";

function parseTimestamp(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : "";
}

function docToQuote(id: string, data: Record<string, unknown>): Quote {
  return {
    id,
    text: String(data.text ?? ""),
    attribution: (data.attribution as string | null) ?? null,
    source_url: (data.source_url as string | null) ?? null,
    published: data.published === true,
    created_at: parseTimestamp(data.created_at),
    updated_at: parseTimestamp(data.updated_at),
  };
}

/** Server-side fetch for the public quotes page (no auth required). */
export async function listPublishedQuotesServer(max = 100): Promise<Quote[]> {
  const db = getServerFirestore();
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where("published", "==", true),
      limit(max),
    ),
  );
  return snap.docs
    .map((d) => docToQuote(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
