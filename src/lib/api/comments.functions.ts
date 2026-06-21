import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { listAllCommentsServer } from "@/lib/firebase/comments-admin.server";
import { listApprovedCommentsServer } from "@/lib/firebase/comments.server";

export const ADMIN_COMMENTS_QUERY_KEY = ["admin-comments"] as const;

export function articleCommentsQueryKey(publicationId: string) {
  return ["comments", publicationId] as const;
}

export const fetchApprovedComments = createServerFn({ method: "POST" })
  .validator(z.object({ publicationId: z.string().min(1) }))
  .handler(async ({ data }) => {
    return listApprovedCommentsServer(data.publicationId);
  });

export const fetchAdminComments = createServerFn({ method: "POST" })
  .validator(z.object({ idToken: z.string().min(1) }))
  .handler(async ({ data }) => {
    return listAllCommentsServer(data.idToken);
  });
