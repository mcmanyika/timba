import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import type { Publication } from "@/lib/categories";
import type { AdminStats } from "@/lib/admin/stats";
import { getFirebaseDb } from "@/integrations/firebase/client";

const COLLECTION = "publications";
const CONTENT_TYPES = ["essay", "policy_paper", "speech", "book", "media"] as const;

function docToSummary(id: string, data: Record<string, unknown>): Publication {
  return {
    id,
    publication_number: String(data.publication_number ?? ""),
    type: String(data.type ?? "essay"),
    category: (data.category as string | null) ?? null,
    title: String(data.title ?? ""),
    slug: String(data.slug ?? ""),
    excerpt: (data.excerpt as string | null) ?? null,
    body: null,
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

export interface DashboardStats extends AdminStats {
  subscribers: number | null;
}

/** Fast dashboard fetch using Firestore count aggregations + small recent queries. */
export async function fetchDashboardStats(includeSubscribers: boolean): Promise<DashboardStats> {
  const db = getFirebaseDb();
  const col = collection(db, COLLECTION);

  const [
    totalSnap,
    publishedSnap,
    draftsSnap,
    featuredSnap,
    recentSnap,
    draftRecentSnap,
    ...typeSnaps
  ] = await Promise.all([
    getCountFromServer(query(col)),
    getCountFromServer(query(col, where("published", "==", true))),
    getCountFromServer(query(col, where("published", "==", false))),
    getCountFromServer(query(col, where("is_featured", "==", true))),
    getDocs(query(col, orderBy("publication_date", "desc"), limit(5))),
    getDocs(
      query(col, where("published", "==", false), orderBy("publication_date", "desc"), limit(5)),
    ),
    ...CONTENT_TYPES.map((type) =>
      getCountFromServer(query(col, where("type", "==", type))),
    ),
  ]);

  const byType: Record<string, number> = {};
  CONTENT_TYPES.forEach((type, i) => {
    const count = typeSnaps[i].data().count;
    if (count > 0) byType[type] = count;
  });

  let subscribers: number | null = null;
  if (includeSubscribers) {
    const subsSnap = await getCountFromServer(collection(db, "subscribers"));
    subscribers = subsSnap.data().count;
  }

  return {
    total: totalSnap.data().count,
    published: publishedSnap.data().count,
    drafts: draftsSnap.data().count,
    featured: featuredSnap.data().count,
    byType,
    recent: recentSnap.docs.map((d) => docToSummary(d.id, d.data())),
    draftRecent: draftRecentSnap.docs.map((d) => docToSummary(d.id, d.data())),
    subscribers,
  };
}
