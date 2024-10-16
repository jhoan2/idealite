import React from 'react';
import CastCard from './CastCard';
import { Cast } from '~/types/cast';

interface RecursiveCastCardProps {
  cast: Cast;
  isTopLevel?: boolean;
}

const RecursiveCastCard: React.FC<RecursiveCastCardProps> = ({ cast, isTopLevel = true }) => {
  const hasDirectReplies = cast.direct_replies && cast.direct_replies.length > 0;
  const isLastInBranch = !hasDirectReplies;
  
  return (
    <div>
      <CastCard
        cast={cast}
        isLastInBranch={isLastInBranch}
        isTopLevel={isTopLevel}
      />

      {hasDirectReplies && (
        cast.replies?.count > 0 ? cast.replies?.map((reply: Cast) => (
          <RecursiveCastCard
            key={reply.hash}
            cast={reply}
            isTopLevel={false}
          />
        )) : null 
      )}
    </div>
  );
};

export default RecursiveCastCard;
