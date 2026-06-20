import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  getServerFirestore,
} from "@/lib/firebase/server-client.server";

export type InquiryType =
  | "general"
  | "media"
  | "speaking"
  | "policy"
  | "subscription"
  | "other";

export interface SaveInquiryInput {
  name: string;
  email: string;
  message: string;
  inquiry_type: InquiryType;
  organization?: string | null;
  phone?: string | null;
  source_page?: string | null;
  conversation_id?: string | null;
  summary?: string | null;
}

export async function saveInquiry(input: SaveInquiryInput): Promise<{ id: string }> {
  const db = getServerFirestore();
  const ref = await addDoc(collection(db, "inquiries"), {
    name: input.name.trim(),
    email: input.email.toLowerCase().trim(),
    message: input.message.trim(),
    inquiry_type: input.inquiry_type,
    organization: input.organization?.trim() || null,
    phone: input.phone?.trim() || null,
    source_page: input.source_page ?? null,
    conversation_id: input.conversation_id ?? null,
    summary: input.summary?.trim() || null,
    status: "new",
    created_at: serverTimestamp(),
  });
  return { id: ref.id };
}

export async function saveSubscriberFromChat(input: {
  first_name: string;
  email: string;
  source?: string | null;
}): Promise<{ created: boolean }> {
  const db = getServerFirestore();
  const email = input.email.toLowerCase().trim();
  const ref = doc(db, "subscribers", email);
  const existing = await getDoc(ref);
  if (existing.exists()) return { created: false };

  await setDoc(ref, {
    first_name: input.first_name.trim(),
    email,
    source: input.source ?? "chat",
    created_at: serverTimestamp(),
  });
  return { created: true };
}
