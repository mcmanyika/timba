import type { User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { getFirebaseDb } from "@/integrations/firebase/client";

export type AccessLevel = "none" | "editor" | "admin";

export interface AdminUserRow {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
  accessLevel: AccessLevel;
}

export function rolesToAccessLevel(roles: string[]): AccessLevel {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("editor")) return "editor";
  return "none";
}

export function accessLevelToRoles(level: AccessLevel): string[] {
  if (level === "admin") return ["admin"];
  if (level === "editor") return ["editor"];
  return [];
}

function parseTimestamp(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : "";
}

/** Create or refresh the Firestore profile for an auth user. */
export async function ensureUserProfile(user: Pick<User, "uid" | "email">): Promise<void> {
  const email = user.email?.toLowerCase();
  if (!email) return;

  const ref = doc(getFirebaseDb(), "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { email, created_at: serverTimestamp() });
    return;
  }
  if (snap.data().email !== email) {
    await updateDoc(ref, { email });
  }
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const db = getFirebaseDb();
  const [usersSnap, rolesSnap] = await Promise.all([
    getDocs(query(collection(db, "users"), orderBy("created_at", "desc"))),
    getDocs(collection(db, "userRoles")),
  ]);

  const byId = new Map<string, AdminUserRow>();

  for (const d of usersSnap.docs) {
    const data = d.data();
    byId.set(d.id, {
      id: d.id,
      email: String(data.email ?? ""),
      created_at: parseTimestamp(data.created_at),
      roles: [],
      accessLevel: "none",
    });
  }

  for (const d of rolesSnap.docs) {
    const roles = Array.isArray(d.data().roles) ? (d.data().roles as string[]) : [];
    const accessLevel = rolesToAccessLevel(roles);
    const existing = byId.get(d.id);
    if (existing) {
      existing.roles = roles;
      existing.accessLevel = accessLevel;
    } else {
      byId.set(d.id, {
        id: d.id,
        email: "",
        created_at: "",
        roles,
        accessLevel,
      });
    }
  }

  return [...byId.values()].sort((a, b) => {
    const aTime = a.created_at ? Date.parse(a.created_at) : 0;
    const bTime = b.created_at ? Date.parse(b.created_at) : 0;
    return bTime - aTime;
  });
}

export async function setUserAccessLevel(userId: string, level: AccessLevel): Promise<void> {
  const ref = doc(getFirebaseDb(), "userRoles", userId);
  const roles = accessLevelToRoles(level);
  if (roles.length === 0) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, { roles });
  }
}
