import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useMemo, useState } from "react";

import {
  commentLikesQueryKey,
  likeComment,
} from "@/lib/firebase/comment-likes";
import {
  getOrCreateVisitorId,
  hasLikedComment,
  markCommentLiked,
} from "@/lib/visitor-id";
import { cn } from "@/lib/utils";

export function CommentLikeButton({
  commentId,
  publicationId,
  count,
}: {
  commentId: string;
  publicationId: string;
  count: number;
}) {
  const qc = useQueryClient();
  const visitorId = useMemo(() => getOrCreateVisitorId(), []);
  const queryKey = commentLikesQueryKey(publicationId);
  const [liked, setLiked] = useState(() => hasLikedComment(commentId));

  const like = useMutation({
    mutationFn: () => likeComment(commentId, visitorId),
    onSuccess: (nextCount) => {
      markCommentLiked(commentId);
      setLiked(true);
      qc.setQueryData<Record<string, number>>(queryKey, (prev) => ({
        ...prev,
        [commentId]: nextCount,
      }));
    },
  });

  return (
    <button
      type="button"
      onClick={() => like.mutate()}
      disabled={like.isPending || liked || !visitorId}
      aria-pressed={liked}
      aria-label={liked ? "You liked this comment" : "Like this comment"}
      className={cn(
        "mt-3 inline-flex items-center gap-1.5 text-xs transition-colors disabled:opacity-60",
        liked ? "text-gold cursor-default" : "text-text-secondary hover:text-gold",
      )}
    >
      <Heart className={cn("size-3.5", liked && "fill-current")} />
      <span>
        {count === 0 && !liked
          ? "Like"
          : count === 1
            ? "1 like"
            : `${count} likes`}
      </span>
    </button>
  );
}
