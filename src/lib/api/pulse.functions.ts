import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { listArticlePulsesServer } from "@/lib/firebase/article-pulse-admin.server";

export const ADMIN_PULSE_QUERY_KEY = ["article-pulse"] as const;

export const fetchAdminArticlePulses = createServerFn({ method: "POST" })
  .validator(z.object({ idToken: z.string().min(1) }))
  .handler(async ({ data }) => {
    return listArticlePulsesServer(data.idToken);
  });
