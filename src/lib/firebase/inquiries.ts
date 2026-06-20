import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import { getFirebaseDb } from "@/integrations/firebase/client";

export type InquiryStatus = "new" | "contacted" | "closed";

export type InquiryType =
  | "general"
  | "media"
  | "speaking"
  | "policy"
  | "subscription"
  | "other";

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  inquiry_type: InquiryType;
  organization: string | null;
  phone: string | null;
  source_page: string | null;
  conversation_id: string | null;
  summary: string | null;
  status: InquiryStatus;
  created_at: string;
}

function parseTimestamp(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : "";
}

export async function listInquiries(): Promise<Inquiry[]> {
  const snap = await getDocs(
    query(collection(getFirebaseDb(), "inquiries"), orderBy("created_at", "desc")),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: String(data.name ?? ""),
      email: String(data.email ?? ""),
      message: String(data.message ?? ""),
      inquiry_type: (data.inquiry_type as InquiryType) ?? "general",
      organization: (data.organization as string | null) ?? null,
      phone: (data.phone as string | null) ?? null,
      source_page: (data.source_page as string | null) ?? null,
      conversation_id: (data.conversation_id as string | null) ?? null,
      summary: (data.summary as string | null) ?? null,
      status: (data.status as InquiryStatus) ?? "new",
      created_at: parseTimestamp(data.created_at),
    };
  });
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "inquiries", id), { status });
}

export const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
  general: "General",
  media: "Media",
  speaking: "Speaking",
  policy: "Policy",
  subscription: "Subscription",
  other: "Other",
};

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  closed: "Closed",
};
