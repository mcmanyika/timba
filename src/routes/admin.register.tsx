import { createFileRoute, redirect } from "@tanstack/react-router";

import { AdminRegisterForm } from "@/components/AdminRegisterForm";
import { waitForAuthUser } from "@/lib/firebase/auth";

export const Route = createFileRoute("/admin/register")({
  ssr: false,
  beforeLoad: async () => {
    const user = await waitForAuthUser();
    if (user) throw redirect({ to: "/admin", replace: true });
  },
  head: () => ({ meta: [{ title: "Admin Register — The Timba Papers" }] }),
  component: AdminRegisterForm,
});
