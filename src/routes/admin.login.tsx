import { createFileRoute, redirect } from "@tanstack/react-router";

import { AdminLoginForm } from "@/components/AdminLoginForm";
import { waitForAuthUser } from "@/lib/firebase/auth";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  beforeLoad: async () => {
    const user = await waitForAuthUser();
    if (user) throw redirect({ to: "/admin", replace: true });
  },
  head: () => ({ meta: [{ title: "Admin Sign In — The Timba Papers" }] }),
  component: AdminLoginForm,
});
