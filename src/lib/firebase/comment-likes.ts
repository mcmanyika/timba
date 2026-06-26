import {
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { getFirebaseDb } from "@/integrations/firebase/client";

const VOTES = "commentLikeVotes";
const COUNTS = "commentLikeCounts";

function voteDocId(commentId: string, visitorId: string): string {
  return `${commentId}_${visitorId}`;
}

export async function getCommentLikeCount(commentId: string): Promise<number> {
  const snap = await getDoc(doc(getFirebaseDb(), COUNTS, commentId));
  return snap.exists() ? Number(snap.data().count ?? 0) : 0;
}

export async function getCommentLikeCounts(
  commentIds: string[],
): Promise<Record<string, number>> {
  if (commentIds.length === 0) return {};

  const entries = await Promise.all(
    commentIds.map(async (id) => {
      const count = await getCommentLikeCount(id);
      return [id, count] as const;
    }),
  );

  return Object.fromEntries(entries);
}

export async function likeComment(commentId: string, visitorId: string): Promise<number> {
  const db = getFirebaseDb();
  const voteRef = doc(db, VOTES, voteDocId(commentId, visitorId));
  const countRef = doc(db, COUNTS, commentId);

  try {
    await setDoc(voteRef, {
      comment_id: commentId,
      visitor_id: visitorId,
      created_at: serverTimestamp(),
    });
  } catch {
    return getCommentLikeCount(commentId);
  }

  const countSnap = await getDoc(countRef);
  if (!countSnap.exists()) {
    await setDoc(countRef, { count: 1 });
    return 1;
  }

  await updateDoc(countRef, { count: increment(1) });
  return Number(countSnap.data().count ?? 0) + 1;
}

export function commentLikesQueryKey(publicationId: string) {
  return ["comment-likes", publicationId] as const;
}
