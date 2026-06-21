import {
  collection,
  getDocs,
  getServerFirestore,
  limit,
  query,
  where,
} from "@/lib/firebase/server-client.server";
import type { Comment } from "@/lib/firebase/comments";

const COLLECTION = "comments";

function parseTimestamp(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : "";
}

function docToComment(id: string, data: Record<string, unknown>): Comment {
  return {
    id,
    publication_id: String(data.publication_id ?? ""),
    publication_slug: String(data.publication_slug ?? ""),
    publication_title: String(data.publication_title ?? ""),
    author_name: String(data.author_name ?? ""),
    author_email: String(data.author_email ?? ""),
    body: String(data.body ?? ""),
    status: (data.status as Comment["status"]) ?? "pending",
    created_at: parseTimestamp(data.created_at),
  };
}

export async function listApprovedCommentsServer(
  publicationId: string,
  max = 100,
): Promise<Comment[]> {
  const db = getServerFirestore();
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where("publication_id", "==", publicationId),
      where("status", "==", "approved"),
      limit(max),
    ),
  );
  return snap.docs
    .map((d) => docToComment(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}
