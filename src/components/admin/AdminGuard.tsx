import { getRouteApi, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import { getFirebaseAuth } from "@/integrations/firebase/client";
import { getUserAccess, signOutUser } from "@/lib/firebase/auth";

const adminRoute = getRouteApi("/_authenticated/admin");

export function AdminGuard({ children }: { children: ReactNode }) {
  const routeAccess = adminRoute.useRouteContext();
  const nav = useNavigate();
  const router = useRouter();
  const [checking, setChecking] = useState(!routeAccess.editorAccess);

  useEffect(() => {
    if (routeAccess.editorAccess) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const user = getFirebaseAuth().currentUser;
      if (!user) {
        if (!cancelled) setChecking(false);
        return;
      }

      try {
        const roles = await getUserAccess(user.uid);
        if (cancelled) return;
        if (roles.editorAccess) {
          await router.invalidate();
        }
      } catch {
        // Route loader already failed; show restricted below.
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [routeAccess.editorAccess, router]);

  async function signOut() {
    await signOutUser();
    nav({ to: "/admin/login", replace: true });
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <p className="text-text-secondary text-sm">Checking access…</p>
      </div>
    );
  }

  if (!routeAccess.editorAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="pub-number">Restricted</div>
          <h1 className="mt-3 font-serif text-3xl">Admin access required</h1>
          <p className="mt-4 text-text-secondary text-sm">
            Signed in as <span className="text-foreground">{routeAccess.userEmail}</span>. An
            administrator must grant you editor or admin access from the Users page.
          </p>
          <button onClick={signOut} className="mt-6 text-gold text-sm">
            Sign out →
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
