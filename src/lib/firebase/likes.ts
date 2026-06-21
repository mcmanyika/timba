import {
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { getFirebaseDb } from "@/integrations/firebase/client";

const VOTES = "publicationLikeVotes";
const COUNTS = "publicationLikeCounts";

function voteDocId(publicationId: string, visitorId: string): string {
  return `${publicationId}_${visitorId}`;
}

export async function getPublicationLikeCount(publicationId: string): Promise<number> {
  const snap = await getDoc(doc(getFirebaseDb(), COUNTS, publicationId));
  return snap.exists() ? Number(snap.data().count ?? 0) : 0;
}

export async function likePublication(
  publicationId: string,
  visitorId: string,
): Promise<number> {
  const db = getFirebaseDb();
  const voteRef = doc(db, VOTES, voteDocId(publicationId, visitorId));
  const countRef = doc(db, COUNTS, publicationId);

  try {
    await setDoc(voteRef, {
      publication_id: publicationId,
      visitor_id: visitorId,
      created_at: serverTimestamp(),
    });
  } catch {
    return getPublicationLikeCount(publicationId);
  }

  const countSnap = await getDoc(countRef);
  if (!countSnap.exists()) {
    await setDoc(countRef, { count: 1 });
    return 1;
  }

  await updateDoc(countRef, { count: increment(1) });
  return Number(countSnap.data().count ?? 0) + 1;
}
