import type { PerspectiveChange } from "@/lib/firebase/article-pulse";

function getProjectId(): string {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Missing VITE_FIREBASE_PROJECT_ID");
  return projectId;
}

function restValue(value: unknown): unknown {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("nullValue" in v) return null;
  return null;
}

type RestDoc = { id: string; data: Record<string, unknown> };

async function runQuery(
  idToken: string,
  collectionId: string,
  limit = 500,
  where?: { field: string; op: string; value: unknown },
): Promise<RestDoc[]> {
  const projectId = getProjectId();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;

  const structuredQuery: Record<string, unknown> = {
    from: [{ collectionId }],
    limit,
  };

  if (where) {
    let firestoreValue: Record<string, unknown>;
    if (typeof where.value === "string") {
      firestoreValue = { stringValue: where.value };
    } else if (typeof where.value === "boolean") {
      firestoreValue = { booleanValue: where.value };
    } else {
      firestoreValue = { stringValue: String(where.value) };
    }
    structuredQuery.where = {
      fieldFilter: {
        field: { fieldPath: where.field },
        op: where.op,
        value: firestoreValue,
      },
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ structuredQuery }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`Could not query ${collectionId} (${res.status})`);
  }

  const rows = (await res.json()) as Array<{
    document?: { name: string; fields: Record<string, unknown> };
  }>;

  return rows
    .filter((row) => row.document)
    .map((row) => {
      const name = row.document!.name;
      const id = name.split("/").pop() ?? "";
      const data = Object.fromEntries(
        Object.entries(row.document!.fields).map(([key, val]) => [key, restValue(val)]),
      );
      return { id, data };
    });
}

async function listCollection(idToken: string, collectionId: string, max = 500): Promise<RestDoc[]> {
  const projectId = getProjectId();
  const docs: RestDoc[] = [];
  let pageToken: string | undefined;

  while (docs.length < max) {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionId}`,
    );
    url.searchParams.set("pageSize", String(Math.min(300, max - docs.length)));
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      throw new Error(`Could not list ${collectionId} (${res.status})`);
    }

    const body = (await res.json()) as {
      documents?: Array<{ name: string; fields: Record<string, unknown> }>;
      nextPageToken?: string;
    };

    for (const doc of body.documents ?? []) {
      const id = doc.name.split("/").pop() ?? "";
      const data = Object.fromEntries(
        Object.entries(doc.fields).map(([key, val]) => [key, restValue(val)]),
      );
      docs.push({ id, data });
    }

    pageToken = body.nextPageToken;
    if (!pageToken) break;
  }

  return docs;
}

export interface ArticleStatsRow {
  publication_id: string;
  title: string;
  slug: string;
  type: string;
  published: boolean;
  publication_date: string;
  views: number;
  likes: number;
  comments: number;
  pulse_count: number;
  pulse_avg_recommend: number;
  pulse_yes: number;
  pulse_somewhat: number;
  pulse_no: number;
}

export interface SiteStatsOverview {
  published_articles: number;
  total_views: number;
  total_likes: number;
  approved_comments: number;
  pending_comments: number;
  total_comment_likes: number;
  pulse_responses: number;
  pulse_avg_recommend: number;
  pulse_yes: number;
  pulse_somewhat: number;
  pulse_no: number;
  subscribers: number | null;
  inquiries_new: number | null;
}

export interface SubscriberMonthRow {
  month: string;
  count: number;
}

export interface SiteStats {
  overview: SiteStatsOverview;
  articles: ArticleStatsRow[];
  subscribers_by_month: SubscriberMonthRow[];
  inquiries_by_type: Record<string, number> | null;
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function fetchSiteStatsServer(
  idToken: string,
  includeAdminMetrics: boolean,
): Promise<SiteStats> {
  const [
    publications,
    viewCounts,
    likeCounts,
    commentLikeCounts,
    comments,
    pulses,
    subscribers,
    inquiries,
  ] = await Promise.all([
    runQuery(idToken, "publications", 500),
    listCollection(idToken, "publicationViewCounts"),
    listCollection(idToken, "publicationLikeCounts"),
    listCollection(idToken, "commentLikeCounts"),
    runQuery(idToken, "comments", 500),
    runQuery(idToken, "articlePulse", 500),
    includeAdminMetrics ? runQuery(idToken, "subscribers", 500) : Promise.resolve([]),
    includeAdminMetrics ? runQuery(idToken, "inquiries", 500) : Promise.resolve([]),
  ]);

  const viewsByPub = Object.fromEntries(
    viewCounts.map((d) => [d.id, Number(d.data.count ?? 0)]),
  );
  const likesByPub = Object.fromEntries(
    likeCounts.map((d) => [d.id, Number(d.data.count ?? 0)]),
  );

  const approvedComments = comments.filter((c) => c.data.status === "approved");
  const pendingComments = comments.filter((c) => c.data.status === "pending");
  const commentsByPub: Record<string, number> = {};
  for (const c of approvedComments) {
    const pubId = String(c.data.publication_id ?? "");
    if (pubId) commentsByPub[pubId] = (commentsByPub[pubId] ?? 0) + 1;
  }

  const pulseByPub = new Map<
    string,
    { count: number; recommend: number; yes: number; somewhat: number; no: number }
  >();
  for (const p of pulses) {
    const pubId = String(p.data.publication_id ?? "");
    if (!pubId) continue;
    const row = pulseByPub.get(pubId) ?? {
      count: 0,
      recommend: 0,
      yes: 0,
      somewhat: 0,
      no: 0,
    };
    row.count += 1;
    row.recommend += Number(p.data.recommend ?? 0);
    const perspective = p.data.perspective_change as PerspectiveChange;
    if (perspective === "yes") row.yes += 1;
    else if (perspective === "somewhat") row.somewhat += 1;
    else if (perspective === "no") row.no += 1;
    pulseByPub.set(pubId, row);
  }

  let pulseYes = 0;
  let pulseSomewhat = 0;
  let pulseNo = 0;
  let pulseRecommendSum = 0;
  for (const p of pulses) {
    pulseRecommendSum += Number(p.data.recommend ?? 0);
    const perspective = p.data.perspective_change as PerspectiveChange;
    if (perspective === "yes") pulseYes += 1;
    else if (perspective === "somewhat") pulseSomewhat += 1;
    else if (perspective === "no") pulseNo += 1;
  }

  const published = publications.filter((p) => p.data.published === true);

  const articles: ArticleStatsRow[] = published
    .map((p) => {
      const pulse = pulseByPub.get(p.id);
      return {
        publication_id: p.id,
        title: String(p.data.title ?? ""),
        slug: String(p.data.slug ?? ""),
        type: String(p.data.type ?? "essay"),
        published: true,
        publication_date: String(p.data.publication_date ?? ""),
        views: viewsByPub[p.id] ?? 0,
        likes: likesByPub[p.id] ?? 0,
        comments: commentsByPub[p.id] ?? 0,
        pulse_count: pulse?.count ?? 0,
        pulse_avg_recommend: pulse && pulse.count > 0 ? pulse.recommend / pulse.count : 0,
        pulse_yes: pulse?.yes ?? 0,
        pulse_somewhat: pulse?.somewhat ?? 0,
        pulse_no: pulse?.no ?? 0,
      };
    })
    .sort((a, b) => b.views - a.views || b.likes - a.likes);

  const subscribersByMonthMap: Record<string, number> = {};
  for (const s of subscribers) {
    const key = monthKey(String(s.data.created_at ?? ""));
    subscribersByMonthMap[key] = (subscribersByMonthMap[key] ?? 0) + 1;
  }
  const subscribers_by_month = Object.entries(subscribersByMonthMap)
    .filter(([m]) => m !== "unknown")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  const inquiries_by_type: Record<string, number> | null = includeAdminMetrics
    ? {}
    : null;
  if (includeAdminMetrics && inquiries_by_type) {
    for (const inq of inquiries) {
      const type = String(inq.data.inquiry_type ?? "general");
      inquiries_by_type[type] = (inquiries_by_type[type] ?? 0) + 1;
    }
  }

  const totalCommentLikes = commentLikeCounts.reduce(
    (sum, d) => sum + Number(d.data.count ?? 0),
    0,
  );

  return {
    overview: {
      published_articles: published.length,
      total_views: Object.values(viewsByPub).reduce((a, b) => a + b, 0),
      total_likes: Object.values(likesByPub).reduce((a, b) => a + b, 0),
      approved_comments: approvedComments.length,
      pending_comments: pendingComments.length,
      total_comment_likes: totalCommentLikes,
      pulse_responses: pulses.length,
      pulse_avg_recommend: pulses.length > 0 ? pulseRecommendSum / pulses.length : 0,
      pulse_yes: pulseYes,
      pulse_somewhat: pulseSomewhat,
      pulse_no: pulseNo,
      subscribers: includeAdminMetrics ? subscribers.length : null,
      inquiries_new: includeAdminMetrics
        ? inquiries.filter((i) => i.data.status === "new").length
        : null,
    },
    articles,
    subscribers_by_month,
    inquiries_by_type,
  };
}
