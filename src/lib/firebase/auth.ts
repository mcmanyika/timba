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

async function waitForAuthToken(user: User): Promise<void> {
  await user.getIdToken(true);
  await getFirebaseAuth().authStateReady();
  getFirebaseDb();
}

export async function signIn(email: string, password: string) {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await waitForAuthToken(cred.user);
  return cred;
}

export async function signUp(email: string, password: string) {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await waitForAuthToken(cred.user);
  await ensureUserProfile(cred.user);
  return cred;
}

export async function signOutUser() {
  await signOut(getFirebaseAuth());
}

export async function ensureFirestoreAuth(): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Not signed in");
  await user.getIdToken(true);
  getFirebaseDb();
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const user = getFirebaseAuth().currentUser;
  if (user) await user.getIdToken(true);

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const snap = await getDoc(doc(getFirebaseDb(), "userRoles", userId));
      if (!snap.exists()) return [];
      const roles = snap.data().roles;
      return Array.isArray(roles) ? roles : [];
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Failed to load user roles");
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
