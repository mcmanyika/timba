import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { getFirebaseDb } from "@/integrations/firebase/client";
import { ensureFirestoreAuth } from "@/lib/firebase/auth";

const COLLECTION = "comments";

export type CommentStatus = "pending" | "approved" | "rejected";

export interface Comment {
  id: string;
  publication_id: string;
  publication_slug: string;
  publication_title: string;
  author_name: string;
  author_email: string;
  body: string;
  status: CommentStatus;
  created_at: string;
}

export type CommentInput = {
  publication_id: string;
  publication_slug: string;
  publication_title: string;
  author_name: string;
  author_email: string;
  body: string;
};

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
    status: (data.status as CommentStatus) ?? "pending",
    created_at: parseTimestamp(data.created_at),
  };
}

function col() {
  return collection(getFirebaseDb(), COLLECTION);
}

export async function listApprovedComments(publicationId: string, max = 100): Promise<Comment[]> {
  const snap = await getDocs(
    query(
      col(),
      where("publication_id", "==", publicationId),
      where("status", "==", "approved"),
      limit(max),
    ),
  );
  return snap.docs
    .map((d) => docToComment(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function listAllComments(max = 500): Promise<Comment[]> {
  await ensureFirestoreAuth();

  const perStatus = Math.ceil(max / 3);
  const statuses: CommentStatus[] = ["pending", "approved", "rejected"];
  const comments: Comment[] = [];

  for (const status of statuses) {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const snap = await getDocs(
          query(col(), where("status", "==", status), limit(perStatus)),
        );
        comments.push(
          ...snap.docs.map((d) => docToComment(d.id, d.data() as Record<string, unknown>)),
        );
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
        }
      }
    }
    if (lastError) throw lastError;
  }

  return comments
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, max);
}

export async function submitComment(input: CommentInput): Promise<void> {
  await addDoc(col(), {
    publication_id: input.publication_id,
    publication_slug: input.publication_slug,
    publication_title: input.publication_title.trim(),
    author_name: input.author_name.trim(),
    author_email: input.author_email.trim().toLowerCase(),
    body: input.body.trim(),
    status: "pending",
    created_at: serverTimestamp(),
  });
}

export async function updateCommentStatus(id: string, status: CommentStatus): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), COLLECTION, id), { status });
}

export async function deleteComment(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), COLLECTION, id));
}

export const COMMENT_STATUS_LABELS: Record<CommentStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};
