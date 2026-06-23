import {
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { getFirebaseDb } from "@/integrations/firebase/client";

const SESSIONS = "publicationViewSessions";
const COUNTS = "publicationViewCounts";

function sessionDocId(publicationId: string, visitorId: string): string {
  return `${publicationId}_${visitorId}`;
}

export async function getPublicationViewCount(publicationId: string): Promise<number> {
  const snap = await getDoc(doc(getFirebaseDb(), COUNTS, publicationId));
  return snap.exists() ? Number(snap.data().count ?? 0) : 0;
}

/** Records one view per visitor per article; returns updated count. */
export async function recordPublicationView(
  publicationId: string,
  visitorId: string,
): Promise<number> {
  const db = getFirebaseDb();
  const sessionRef = doc(db, SESSIONS, sessionDocId(publicationId, visitorId));
  const countRef = doc(db, COUNTS, publicationId);

  try {
    await setDoc(sessionRef, {
      publication_id: publicationId,
      visitor_id: visitorId,
      created_at: serverTimestamp(),
    });
  } catch {
    return getPublicationViewCount(publicationId);
  }

  const countSnap = await getDoc(countRef);
  if (!countSnap.exists()) {
    await setDoc(countRef, { count: 1 });
    return 1;
  }

  await updateDoc(countRef, { count: increment(1) });
  return Number(countSnap.data().count ?? 0) + 1;
}
