import { getRouteApi } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { signOutUser } from "@/lib/firebase/auth";

const adminRoute = getRouteApi("/_authenticated/admin");

export function AdminGuard({ children }: { children: ReactNode }) {
  const { editorAccess, userEmail } = adminRoute.useRouteContext();
  const nav = useNavigate();

  async function signOut() {
    await signOutUser();
    nav({ to: "/admin/login", replace: true });
  }

  if (!editorAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="pub-number">Restricted</div>
          <h1 className="mt-3 font-serif text-3xl">Admin access required</h1>
          <p className="mt-4 text-text-secondary text-sm">
            Signed in as <span className="text-foreground">{userEmail}</span>. A project
            administrator must grant you a role in the Firestore{" "}
            <code>userRoles</code> collection.
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
