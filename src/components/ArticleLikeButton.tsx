import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useMemo, useState } from "react";

import {
  getPublicationLikeCount,
  likePublication as likePublicationClient,
} from "@/lib/firebase/likes";
import {
  getOrCreateVisitorId,
  hasLikedPublication,
  markPublicationLiked,
} from "@/lib/visitor-id";
import { cn } from "@/lib/utils";

function publicationLikesQueryKey(publicationId: string) {
  return ["publication-likes", publicationId] as const;
}

export function ArticleLikeButton({ publicationId }: { publicationId: string }) {
  const qc = useQueryClient();
  const visitorId = useMemo(() => getOrCreateVisitorId(), []);
  const queryKey = publicationLikesQueryKey(publicationId);
  const [liked, setLiked] = useState(() => hasLikedPublication(publicationId));

  const { data: count = 0, isLoading } = useQuery({
    queryKey,
    queryFn: () => getPublicationLikeCount(publicationId),
  });

  const like = useMutation({
    mutationFn: () => likePublicationClient(publicationId, visitorId),
    onSuccess: (nextCount) => {
      markPublicationLiked(publicationId);
      setLiked(true);
      qc.setQueryData(queryKey, nextCount);
    },
  });

  const busy = isLoading || like.isPending;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={() => like.mutate()}
        disabled={busy || liked || !visitorId}
        aria-pressed={liked}
        aria-label={liked ? "You liked this article" : "Like this article"}
        className={cn(
          "inline-flex items-center gap-2 border px-4 py-2 text-xs uppercase tracking-wider transition-colors disabled:opacity-60",
          liked
            ? "border-gold bg-gold/10 text-gold cursor-default"
            : "border-divider text-text-secondary hover:border-gold hover:text-gold",
        )}
      >
        <Heart className={cn("size-4", liked && "fill-current")} />
        {liked ? "Liked" : "Like"}
      </button>
      <span className="text-sm text-text-secondary">
        {count === 1 ? "1 reader found this valuable" : `${count} readers found this valuable`}
      </span>
    </div>
  );
}
