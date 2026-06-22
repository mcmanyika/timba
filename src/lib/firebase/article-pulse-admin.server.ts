import type { ArticlePulse, PerspectiveChange } from "@/lib/firebase/article-pulse";

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

function docFromRest(name: string, fields: Record<string, unknown>): ArticlePulse {
  const id = name.split("/").pop() ?? "";
  const data = Object.fromEntries(
    Object.entries(fields).map(([key, val]) => [key, restValue(val)]),
  );
  return {
    id,
    publication_id: String(data.publication_id ?? ""),
    publication_slug: String(data.publication_slug ?? ""),
    publication_title: String(data.publication_title ?? ""),
    visitor_id: String(data.visitor_id ?? ""),
    perspective_change: (data.perspective_change as PerspectiveChange) ?? "somewhat",
    recommend: Number(data.recommend ?? 0),
    missing_note: (data.missing_note as string | null) ?? null,
    created_at: typeof data.created_at === "string" ? data.created_at : "",
  };
}

/** Admin pulse list via Firestore REST + user ID token (avoids client SDK sync hangs). */
export async function listArticlePulsesServer(
  idToken: string,
  max = 500,
): Promise<ArticlePulse[]> {
  const projectId = getProjectId();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "articlePulse" }],
        orderBy: [{ field: { fieldPath: "created_at" }, direction: "DESCENDING" }],
        limit: max,
      },
    }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) {
    throw new Error(`Could not load reader pulse (${res.status})`);
  }

  const rows = (await res.json()) as Array<{
    document?: { name: string; fields: Record<string, unknown> };
  }>;

  return rows
    .filter((row) => row.document)
    .map((row) => docFromRest(row.document!.name, row.document!.fields));
}
