import { createFileRoute } from "@tanstack/react-router";

import { listPublishedPressStatements } from "@/lib/firebase/press-statements.server";

export const Route = createFileRoute("/api/press-statements")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        try {
          const articles = await listPublishedPressStatements(origin);
          return Response.json(
            { articles },
            {
              headers: {
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=60",
              },
            },
          );
        } catch (error) {
          console.error(error);
          return Response.json(
            { error: "Could not load press statements." },
            { status: 500, headers: { "Access-Control-Allow-Origin": "*" } },
          );
        }
      },
    },
  },
});
