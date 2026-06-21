import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { listAllCommentsServer } from "@/lib/firebase/comments-admin.server";

export const ADMIN_COMMENTS_QUERY_KEY = ["admin-comments"] as const;

export const fetchAdminComments = createServerFn({ method: "POST" })
  .validator(z.object({ idToken: z.string().min(1) }))
  .handler(async ({ data }) => {
    return listAllCommentsServer(data.idToken);
  });
