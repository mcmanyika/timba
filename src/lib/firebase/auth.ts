import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { getFirebaseAuth, getFirebaseDb } from "@/integrations/firebase/client";
import { ensureUserProfile } from "@/lib/firebase/users";

/** Wait until Firebase has restored auth state from persistence. */
export async function waitForAuthUser(): Promise<User | null> {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  return auth.currentUser;
}

export async function signIn(email: string, password: string) {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await auth.authStateReady();
  await ensureUserProfile(cred.user);
  return cred;
}

export async function signUp(email: string, password: string) {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await auth.authStateReady();
  await ensureUserProfile(cred.user);
  return cred;
}

export async function signOutUser() {
  return signOut(getFirebaseAuth());
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const snap = await getDoc(doc(getFirebaseDb(), "userRoles", userId));
  if (!snap.exists()) return [];
  const roles = snap.data().roles;
  return Array.isArray(roles) ? roles : [];
}

export async function getUserAccess(userId: string) {
  const roles = await getUserRoles(userId);
  return {
    roles,
    isAdmin: roles.includes("admin"),
    isEditor: roles.includes("editor"),
    editorAccess: roles.includes("admin") || roles.includes("editor"),
  };
}

export async function isEditorOrAdmin(userId: string): Promise<boolean> {
  const { editorAccess } = await getUserAccess(userId);
  return editorAccess;
}
