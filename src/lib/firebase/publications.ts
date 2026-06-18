import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
  type QueryConstraint,
} from "firebase/firestore";

import { getFirebaseDb } from "@/integrations/firebase/client";
import type { Publication } from "@/lib/categories";

const COLLECTION = "publications";

function docToPublication(id: string, data: Record<string, unknown>): Publication {
  return {
    id,
    publication_number: String(data.publication_number ?? ""),
    type: String(data.type ?? "essay"),
    category: (data.category as string | null) ?? null,
    title: String(data.title ?? ""),
    slug: String(data.slug ?? ""),
    excerpt: (data.excerpt as string | null) ?? null,
    body: (data.body as string | null) ?? null,
    featured_image_url: (data.featured_image_url as string | null) ?? null,
    pdf_url: (data.pdf_url as string | null) ?? null,
    media_embed_url: (data.media_embed_url as string | null) ?? null,
    location: (data.location as string | null) ?? null,
    occasion: (data.occasion as string | null) ?? null,
    published: Boolean(data.published),
    is_featured: Boolean(data.is_featured),
    publication_date: String(data.publication_date ?? ""),
    created_at: String(data.created_at ?? ""),
    updated_at: String(data.updated_at ?? ""),
  };
}

function docToSummary(id: string, data: Record<string, unknown>): Publication {
  return { ...docToPublication(id, data), body: null };
}

function col() {
  return collection(getFirebaseDb(), COLLECTION);
}

async function generatePublicationNumber(publicationDate: string): Promise<string> {
  const yr = publicationDate.slice(0, 4);
  const prefix = `TP-${yr}-`;
  const nextYearPrefix = `TP-${Number(yr) + 1}-`;
  const q = query(
    collection(getFirebaseDb(), COLLECTION),
    where("publication_number", ">=", prefix),
    where("publication_number", "<", nextYearPrefix),
    orderBy("publication_number", "desc"),
    limit(1),
  );
  const snap = await getDocs(q);
  const last = snap.docs[0]?.data().publication_number as string | undefined;
  const lastNum = last ? Number(last.split("-")[2]) : 0;
  return `TP-${yr}-${String(lastNum + 1).padStart(3, "0")}`;
}

export async function listPublishedPublications(options?: {
  type?: string | string[];
  limit?: number;
}): Promise<Publication[]> {
  const constraints: QueryConstraint[] = [where("published", "==", true)];

  if (options?.type) {
    if (Array.isArray(options.type)) {
      if (options.type.length === 1) {
        constraints.push(where("type", "==", options.type[0]));
      } else if (options.type.length > 0) {
        constraints.push(where("type", "in", options.type.slice(0, 10)));
      }
    } else {
      constraints.push(where("type", "==", options.type));
    }
  }

  constraints.push(orderBy("publication_date", "desc"));
  if (options?.limit) constraints.push(limit(options.limit));

  const snap = await getDocs(query(col(), ...constraints));
  return snap.docs.map((d) => docToPublication(d.id, d.data()));
}

export async function listAllPublications(): Promise<Publication[]> {
  const snap = await getDocs(query(col(), orderBy("publication_date", "desc")));
  return snap.docs.map((d) => docToSummary(d.id, d.data()));
}

export async function getPublicationBySlug(
  slug: string,
  publishedOnly = true,
): Promise<Publication | null> {
  const constraints: QueryConstraint[] = [where("slug", "==", slug)];
  if (publishedOnly) constraints.push(where("published", "==", true));

  const snap = await getDocs(query(col(), ...constraints));
  const docSnap = snap.docs[0];
  if (!docSnap) return null;
  return docToPublication(docSnap.id, docSnap.data());
}

export async function getPublicationById(id: string): Promise<Publication | null> {
  const snap = await getDoc(doc(getFirebaseDb(), COLLECTION, id));
  if (!snap.exists()) return null;
  return docToPublication(snap.id, snap.data());
}

export type PublicationInput = Omit<
  Publication,
  "id" | "created_at" | "updated_at" | "publication_number"
> & {
  publication_number?: string | null;
};

export async function createPublication(input: PublicationInput): Promise<Publication> {
  const now = new Date().toISOString();
  const publication_number =
    input.publication_number?.trim() ||
    (await generatePublicationNumber(input.publication_date));

  const payload = {
    ...input,
    publication_number,
    category: input.category || null,
    created_at: now,
    updated_at: now,
  };

  const ref = await addDoc(col(), payload);
  return docToPublication(ref.id, payload);
}

export async function updatePublication(
  id: string,
  input: Partial<PublicationInput>,
): Promise<void> {
  const payload: Record<string, unknown> = {
    ...input,
    updated_at: new Date().toISOString(),
  };
  if ("category" in input) payload.category = input.category || null;
  if ("publication_number" in input && !input.publication_number) {
    delete payload.publication_number;
  }
  await updateDoc(doc(getFirebaseDb(), COLLECTION, id), payload);
}

export async function deletePublication(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), COLLECTION, id));
}

export async function setFeaturedPublication(id: string): Promise<void> {
  const db = getFirebaseDb();
  const all = await listAllPublications();
  await Promise.all(
    all
      .filter((p) => p.is_featured && p.id !== id)
      .map((p) => updateDoc(doc(db, COLLECTION, p.id), { is_featured: false })),
  );
  await updateDoc(doc(db, COLLECTION, id), { is_featured: true });
}

export async function setPublicationPublished(id: string, published: boolean): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), COLLECTION, id), { published });
}
