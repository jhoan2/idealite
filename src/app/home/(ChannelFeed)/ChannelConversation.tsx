'use client'

import React, { useState, useEffect } from 'react';
import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";
import { useNeynarContext } from '@neynar/react';
import ConversationList from './ConversationList';
import { Cast } from '~/types/cast';

export default function ChannelConversation() {
  const [casts, setCasts] = useState<Cast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const { user } = useNeynarContext();

  const fetchChannelFeed = async (cursorParam: string | null = null) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        fid: user?.fid?.toString() || '2070',
      });
      if (cursorParam) {
        params.append('cursor', cursorParam);
      }
      const response = await fetch(`/api/channelFeed?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch channel feed');
      }
      const data = await response.json();
      setCasts(prevCasts => cursorParam ? [...prevCasts, ...data.casts] : data.casts);
      setCursor(data.next ? data.next.cursor : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannelFeed();
  }, [user?.fid]);

  const loadMore = () => {
    if (cursor) {
      fetchChannelFeed(cursor);
    }
  };

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <ConversationList casts={casts} />
      {loading && <Loader2 className="w-6 h-6 animate-spin" />}
      {cursor && !loading && (
        <Button onClick={loadMore} variant="outline">
          Load More
        </Button>
      )}
    </div>
  );
}