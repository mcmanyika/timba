import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { fetchSiteStatsServer } from "@/lib/firebase/stats-admin.server";

export const ADMIN_STATS_QUERY_KEY = ["admin-stats"] as const;

export const fetchAdminSiteStats = createServerFn({ method: "POST" })
  .validator(
    z.object({
      idToken: z.string().min(1),
      includeAdminMetrics: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    return fetchSiteStatsServer(data.idToken, data.includeAdminMetrics);
  });
