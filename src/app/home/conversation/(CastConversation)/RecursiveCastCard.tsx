import React from "react";
import CastCard from "./CastCard";
import { Cast } from "~/types/cast";

interface RecursiveCastCardProps {
  cast: Cast;
  isTopLevel?: boolean;
  onShowMoreReplies: (cursor: string) => void;
}

const RecursiveCastCard: React.FC<RecursiveCastCardProps> = ({
  cast,
  onShowMoreReplies,
  isTopLevel = true,
}) => {
  const hasDirectReplies =
    cast.direct_replies && cast.direct_replies.length > 0;
  const isLastInBranch = !hasDirectReplies;

  return (
    <div>
      <CastCard
        cast={{ ...cast }}
        onShowMoreReplies={onShowMoreReplies}
        isLastInBranch={isLastInBranch}
        isTopLevel={isTopLevel}
      />

      {hasDirectReplies &&
        cast.direct_replies &&
        cast.direct_replies.map((reply, index) => (
          <RecursiveCastCard
            key={reply.hash}
            cast={reply}
            onShowMoreReplies={onShowMoreReplies}
            isTopLevel={false}
          />
        ))}
    </div>
  );
};

export default RecursiveCastCard;
