import { FirebaseError } from "firebase/app";
import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";

import { getFirebaseDb } from "@/integrations/firebase/client";

export interface Subscriber {
  id: string;
  first_name: string;
  email: string;
  source: string | null;
  created_at: string;
}

export async function subscribe(input: {
  first_name: string;
  email: string;
  source?: string | null;
}): Promise<void> {
  const email = input.email.toLowerCase();
  const db = getFirebaseDb();
  const ref = doc(db, "subscribers", email);
  await setDoc(ref, {
    first_name: input.first_name,
    email,
    source: input.source ?? null,
    created_at: serverTimestamp(),
  });
}

export async function listSubscribers(): Promise<Subscriber[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(collection(db, "subscribers"), orderBy("created_at", "desc")),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    const created = data.created_at;
    return {
      id: d.id,
      first_name: String(data.first_name ?? ""),
      email: String(data.email ?? d.id),
      source: (data.source as string | null) ?? null,
      created_at:
        created && typeof created === "object" && "toDate" in created
          ? (created as { toDate: () => Date }).toDate().toISOString()
          : String(created ?? ""),
    };
  });
}

export function isDuplicateSubscriberError(error: unknown): boolean {
  if (error instanceof FirebaseError) {
    return error.code === "permission-denied" || error.code === "already-exists";
  }
  return error instanceof Error && error.message === "already-exists";
}
