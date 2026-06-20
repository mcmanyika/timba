import { createServerFn } from "@tanstack/react-start";

import { listPublishedQuotesServer } from "@/lib/firebase/quotes.server";

export const PUBLIC_QUOTES_QUERY_KEY = ["quotes-public"] as const;

export const fetchPublishedQuotes = createServerFn({ method: "GET" }).handler(async () => {
  return listPublishedQuotesServer();
});
