import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminShell } from "@/components/admin/AdminLayout";
import { getUserAccess } from "@/lib/firebase/auth";
import { ensureUserProfile } from "@/lib/firebase/users";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const user = context.user;
    if (!user) throw redirect({ to: "/admin/login" });

    await user.getIdToken(true);

    try {
      await ensureUserProfile(user);
    } catch (error) {
      console.error("[admin] user profile sync failed:", error);
    }

    const roles = await getUserAccess(user.uid);
    return {
      editorAccess: roles.editorAccess,
      isAdmin: roles.isAdmin,
      userEmail: user.email ?? "",
    };
  },
  component: AdminRoute,
});

function AdminRoute() {
  return (
    <AdminGuard>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </AdminGuard>
  );
}
