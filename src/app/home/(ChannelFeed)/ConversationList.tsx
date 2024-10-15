import React from 'react';
import RecursiveCastCard from './RecursiveCastCard';
import ChannelFeedCard from './ChannelFeedCard';
import { Cast } from '~/types/cast';

interface ConversationListProps {
  casts: Cast[];
}

export default function ConversationList({ casts }: ConversationListProps) {
  return (
    <div className="space-y-4 pt-4">
      {casts.map((cast) => (
        <ChannelFeedCard key={cast.hash} cast={cast} />
      ))}
    </div>
  );
}