import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, terminate, type Firestore } from "firebase/firestore";

function getFirebaseConfig() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    const message = `Missing Firebase environment variable(s): ${missing.join(", ")}. See .env.example.`;
    console.error(`[Firebase] ${message}`);
    throw new Error(message);
  }

  return config as {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _db: Firestore | undefined;

function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(getFirebaseConfig()) : getApp();
  }
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(getFirebaseApp());
  return _auth;
}

export function getFirebaseDb(): Firestore {
  if (!_db) _db = getFirestore(getFirebaseApp());
  return _db;
}

/** Tear down Firestore listeners between auth sessions to avoid SDK sync errors. */
export async function resetFirebaseDb(): Promise<void> {
  if (!_db) return;
  try {
    await terminate(_db);
  } catch {
    // Already terminated or never started.
  }
  _db = undefined;
}

function bindProxy<T extends object>(getTarget: () => T): T {
  return new Proxy({} as T, {
    get(_, prop, receiver) {
      const target = getTarget();
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function") {
        return (value as (...args: unknown[]) => unknown).bind(target);
      }
      return value;
    },
  });
}

/** @deprecated Prefer getFirebaseAuth() for methods like authStateReady(). */
export const auth = bindProxy(getFirebaseAuth);

/** @deprecated Prefer getFirebaseDb() in new code. */
export const db = bindProxy(getFirebaseDb);
