import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminShell } from "@/components/admin/AdminLayout";
import { getUserAccess } from "@/lib/firebase/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const user = context.user;
    if (!user) throw redirect({ to: "/admin/login" });

    let access = { editorAccess: false, isAdmin: false, userEmail: user.email ?? "" };
    try {
      const roles = await getUserAccess(user.uid);
      access = {
        editorAccess: roles.editorAccess,
        isAdmin: roles.isAdmin,
        userEmail: user.email ?? "",
      };
    } catch (error) {
      console.error("[admin] role check failed:", error);
    }

    return access;
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
