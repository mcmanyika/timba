import type { Comment, CommentStatus } from "@/lib/firebase/comments";

const STATUSES: CommentStatus[] = ["pending", "approved", "rejected"];

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

function docFromRest(name: string, fields: Record<string, unknown>): Comment {
  const id = name.split("/").pop() ?? "";
  const data = Object.fromEntries(
    Object.entries(fields).map(([key, val]) => [key, restValue(val)]),
  );
  return {
    id,
    publication_id: String(data.publication_id ?? ""),
    publication_slug: String(data.publication_slug ?? ""),
    publication_title: String(data.publication_title ?? ""),
    author_name: String(data.author_name ?? ""),
    author_email: String(data.author_email ?? ""),
    body: String(data.body ?? ""),
    status: (data.status as CommentStatus) ?? "pending",
    created_at: typeof data.created_at === "string" ? data.created_at : "",
  };
}

async function queryCommentsByStatus(
  idToken: string,
  status: CommentStatus,
  max: number,
): Promise<Comment[]> {
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
        from: [{ collectionId: "comments" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "status" },
            op: "EQUAL",
            value: { stringValue: status },
          },
        },
        limit: max,
      },
    }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Could not load ${status} comments (${res.status})`);
  }

  const rows = (await res.json()) as Array<{ document?: { name: string; fields: Record<string, unknown> } }>;
  return rows
    .filter((row) => row.document)
    .map((row) => docFromRest(row.document!.name, row.document!.fields));
}

/** Admin comment list via Firestore REST + user ID token (avoids client SDK sync hangs). */
export async function listAllCommentsServer(idToken: string, max = 500): Promise<Comment[]> {
  const perStatus = Math.ceil(max / 3);
  const batches = await Promise.all(
    STATUSES.map((status) => queryCommentsByStatus(idToken, status, perStatus)),
  );
  return batches
    .flat()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, max);
}
