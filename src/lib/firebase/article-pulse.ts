import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { getFirebaseDb } from "@/integrations/firebase/client";

const COLLECTION = "articlePulse";

export type PerspectiveChange = "yes" | "somewhat" | "no";

export interface ArticlePulse {
  id: string;
  publication_id: string;
  publication_slug: string;
  publication_title: string;
  visitor_id: string;
  perspective_change: PerspectiveChange;
  recommend: number;
  missing_note: string | null;
  created_at: string;
}

export type ArticlePulseInput = {
  publication_id: string;
  publication_slug: string;
  publication_title: string;
  visitor_id: string;
  perspective_change: PerspectiveChange;
  recommend: number;
  missing_note?: string | null;
};

export interface ArticlePulseAggregate {
  publication_id: string;
  publication_slug: string;
  publication_title: string;
  total: number;
  yes: number;
  somewhat: number;
  no: number;
  avgRecommend: number;
  recentNotes: { note: string; created_at: string }[];
}

export const PERSPECTIVE_LABELS: Record<PerspectiveChange, string> = {
  yes: "Yes",
  somewhat: "Somewhat",
  no: "No",
};

function pulseDocId(publicationId: string, visitorId: string): string {
  return `${publicationId}_${visitorId}`;
}

function parseTimestamp(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : "";
}

function docToPulse(id: string, data: Record<string, unknown>): ArticlePulse {
  return {
    id,
    publication_id: String(data.publication_id ?? ""),
    publication_slug: String(data.publication_slug ?? ""),
    publication_title: String(data.publication_title ?? ""),
    visitor_id: String(data.visitor_id ?? ""),
    perspective_change: (data.perspective_change as PerspectiveChange) ?? "somewhat",
    recommend: Number(data.recommend ?? 0),
    missing_note: (data.missing_note as string | null) ?? null,
    created_at: parseTimestamp(data.created_at),
  };
}

export async function submitArticlePulse(input: ArticlePulseInput): Promise<void> {
  const note = input.missing_note?.trim() ?? "";
  await setDoc(doc(getFirebaseDb(), COLLECTION, pulseDocId(input.publication_id, input.visitor_id)), {
    publication_id: input.publication_id,
    publication_slug: input.publication_slug,
    publication_title: input.publication_title.trim(),
    visitor_id: input.visitor_id,
    perspective_change: input.perspective_change,
    recommend: Math.round(input.recommend),
    missing_note: note.length > 0 ? note : null,
    created_at: serverTimestamp(),
  });
}

export async function listArticlePulses(max = 500): Promise<ArticlePulse[]> {
  const snap = await getDocs(
    query(collection(getFirebaseDb(), COLLECTION), orderBy("created_at", "desc")),
  );
  return snap.docs
    .slice(0, max)
    .map((d) => docToPulse(d.id, d.data() as Record<string, unknown>));
}

export function aggregateArticlePulses(pulses: ArticlePulse[]): ArticlePulseAggregate[] {
  const byPub = new Map<string, ArticlePulse[]>();

  for (const pulse of pulses) {
    const list = byPub.get(pulse.publication_id) ?? [];
    list.push(pulse);
    byPub.set(pulse.publication_id, list);
  }

  return [...byPub.entries()]
    .map(([, items]) => {
      const first = items[0]!;
      const yes = items.filter((p) => p.perspective_change === "yes").length;
      const somewhat = items.filter((p) => p.perspective_change === "somewhat").length;
      const no = items.filter((p) => p.perspective_change === "no").length;
      const avgRecommend =
        items.reduce((sum, p) => sum + p.recommend, 0) / Math.max(items.length, 1);

      const recentNotes = items
        .filter((p) => p.missing_note)
        .slice(0, 5)
        .map((p) => ({ note: p.missing_note!, created_at: p.created_at }));

      return {
        publication_id: first.publication_id,
        publication_slug: first.publication_slug,
        publication_title: first.publication_title,
        total: items.length,
        yes,
        somewhat,
        no,
        avgRecommend,
        recentNotes,
      };
    })
    .sort((a, b) => b.total - a.total);
}
