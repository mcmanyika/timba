import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import {
  getPublicationViewCount,
  recordPublicationView,
} from "@/lib/firebase/views";
import {
  getOrCreateVisitorId,
  hasRecordedPublicationView,
  markPublicationViewRecorded,
} from "@/lib/visitor-id";

function publicationViewsQueryKey(publicationId: string) {
  return ["publication-views", publicationId] as const;
}

function formatViewCount(count: number): string {
  return count.toLocaleString();
}

export function ArticleViewCount({ publicationId }: { publicationId: string }) {
  const qc = useQueryClient();
  const visitorId = useMemo(() => getOrCreateVisitorId(), []);
  const queryKey = publicationViewsQueryKey(publicationId);
  const recordedRef = useRef(false);

  const { data: count = 0, isLoading } = useQuery({
    queryKey,
    queryFn: () => getPublicationViewCount(publicationId),
  });

  useEffect(() => {
    if (!visitorId || recordedRef.current || hasRecordedPublicationView(publicationId)) {
      return;
    }
    recordedRef.current = true;

    recordPublicationView(publicationId, visitorId)
      .then((nextCount) => {
        markPublicationViewRecorded(publicationId);
        qc.setQueryData(queryKey, nextCount);
      })
      .catch(() => {
        recordedRef.current = false;
      });
  }, [publicationId, visitorId, qc, queryKey]);

  if (isLoading && count === 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
      <Eye className="size-3.5 opacity-70" aria-hidden />
      {formatViewCount(count)} {count === 1 ? "view" : "views"}
    </span>
  );
}
