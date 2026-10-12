import { createFileRoute } from "@tanstack/react-router";

import { listPublishedPapers } from "@/lib/firebase/papers.server";

export const Route = createFileRoute("/api/papers")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        try {
          const articles = await listPublishedPapers(origin);
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
            { error: "Could not load papers." },
            { status: 500, headers: { "Access-Control-Allow-Origin": "*" } },
          );
        }
      },
    },
  },
});
