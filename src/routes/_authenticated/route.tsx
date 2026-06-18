import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { waitForAuthUser } from "@/lib/firebase/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = await waitForAuthUser();
    if (!user) throw redirect({ to: "/admin/login" });
    return { user };
  },
  component: () => <Outlet />,
});
