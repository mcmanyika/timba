import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/comments")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/comments" });
  },
});
