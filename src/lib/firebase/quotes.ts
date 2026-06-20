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
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { getFirebaseDb } from "@/integrations/firebase/client";

const COLLECTION = "quotes";

export interface Quote {
  id: string;
  text: string;
  attribution: string | null;
  source_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

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

function col() {
  return collection(getFirebaseDb(), COLLECTION);
}

export async function listPublishedQuotes(max = 100): Promise<Quote[]> {
  const snap = await getDocs(
    query(col(), where("published", "==", true), limit(max)),
  );
  return snap.docs
    .map((d) => docToQuote(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function listAllQuotes(): Promise<Quote[]> {
  const snap = await getDocs(query(col(), orderBy("created_at", "desc")));
  return snap.docs.map((d) => docToQuote(d.id, d.data() as Record<string, unknown>));
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  const snap = await getDoc(doc(getFirebaseDb(), COLLECTION, id));
  if (!snap.exists()) return null;
  return docToQuote(snap.id, snap.data() as Record<string, unknown>);
}

export type QuoteInput = {
  text: string;
  attribution?: string | null;
  source_url?: string | null;
  published: boolean;
};

export async function createQuote(input: QuoteInput): Promise<Quote> {
  const payload = {
    text: input.text.trim(),
    attribution: input.attribution?.trim() || null,
    source_url: input.source_url?.trim() || null,
    published: input.published === true,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };
  const ref = await addDoc(col(), payload);
  const snap = await getDoc(ref);
  return docToQuote(snap.id, snap.data() as Record<string, unknown>);
}

export async function updateQuote(id: string, input: Partial<QuoteInput>): Promise<void> {
  const payload: Record<string, unknown> = {
    updated_at: serverTimestamp(),
  };
  if ("text" in input) payload.text = input.text?.trim() ?? "";
  if ("attribution" in input) payload.attribution = input.attribution?.trim() || null;
  if ("source_url" in input) payload.source_url = input.source_url?.trim() || null;
  if ("published" in input) payload.published = input.published === true;
  await updateDoc(doc(getFirebaseDb(), COLLECTION, id), payload);
}

export async function deleteQuote(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), COLLECTION, id));
}

export async function setQuotePublished(id: string, published: boolean): Promise<void> {
  await updateQuote(id, { published });
}
