"use client";

import React, { useState, useEffect, useRef } from "react";
import { useNeynarContext } from "@neynar/react";
import { Loader2, ChevronDown, ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { CastConversation } from "~/types/cast";
import RecursiveCastCard from "./RecursiveCastCard";
import { Button } from "~/components/ui/button";
import Link from "next/link";

export default function Conversation() {
  const [castConversation, setCastConversation] =
    useState<CastConversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useNeynarContext();
  const fetchedRef = useRef(false);
  const searchParams = useSearchParams();
  const hash = searchParams.get("hash");

  const fetchMoreReplies = async (parentCastHash: string) => {
    if (!user || !user.fid) {
      console.error("Profile or farcasterId is undefined");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/castConversation?hash=${parentCastHash}&fId=${user.fid}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const newReplies = await response.json();
      setCastConversation((prevData: CastConversation | null) => {
        if (!prevData) return null;
        const updateReplies = (cast: any) => {
          if (cast.hash === parentCastHash) {
            return {
              ...cast,
              direct_replies: [
                ...(cast.direct_replies || []),
                ...(newReplies.conversation.cast.direct_replies || []),
              ],
              replies: {
                ...cast.replies,
                count:
                  cast.replies.count +
                  (newReplies.conversation.cast.direct_replies?.length || 0),
              },
            };
          }
          return {
            ...cast,
            direct_replies: (cast.direct_replies || []).map(updateReplies),
          };
        };

        return {
          ...prevData,
          conversation: {
            ...prevData?.conversation,
            cast: updateReplies(prevData?.conversation?.cast),
          },
        };
      });
    } catch (error) {
      console.error("Error fetching more replies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCastConversation = async (cursor: string | null | undefined) => {
    if (!hash || !user) {
      console.error("hash or user profile.farcasterId is undefined");
      return;
    }

    setIsLoading(true);
    try {
      let url = `/api/castConversation?hash=${hash}&fId=${user.fid}`;

      if (cursor) {
        url += `&cursor=${cursor}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setCastConversation((prevData: CastConversation | null) => {
        if (prevData && prevData.conversation && prevData.conversation.cast) {
          return {
            ...prevData,
            conversation: {
              ...prevData.conversation,
              cast: {
                ...prevData.conversation.cast,
                direct_replies: [
                  ...(prevData.conversation.cast.direct_replies || []),
                  ...(data.conversation.cast.direct_replies || []),
                ],
              },
            },
            next: {
              ...prevData.next,
              cursor: data.next?.cursor || null,
            },
          };
        }
        return data;
      });
    } catch (error) {
      console.error("Error fetching event feed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!castConversation && !fetchedRef.current) {
      //the ref keeps track of whether we've fetched the data so there are no duplicates
      fetchedRef.current = true;
      fetchCastConversation(null);
    }
  }, [hash]);

  return (
    <div className="relative space-y-4 pt-4">
      <Link href="/home" className="mb-4 inline-block">
        <Button variant="ghost" className="rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </Link>
      {isLoading && (
        <div className="z-10 flex items-center justify-center bg-white bg-opacity-50">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      )}
      {castConversation &&
      castConversation.conversation &&
      castConversation.conversation.cast ? (
        <RecursiveCastCard
          cast={castConversation.conversation.cast as any}
          onShowMoreReplies={fetchMoreReplies}
        />
      ) : null}
      {castConversation &&
        castConversation.next &&
        castConversation.next.cursor && (
          <div className="mt-4 flex items-center justify-center">
            <button
              onClick={() =>
                fetchCastConversation(castConversation.next?.cursor)
              }
              className="flex items-center space-x-2 rounded-full bg-gray-100 px-4 py-2 transition-colors duration-200 hover:bg-gray-200"
            >
              <span>Load more</span>
              <ChevronDown className="h-4 w-4" />
              <div className="h-2 w-2 rounded-full bg-yellow-400" />
            </button>
          </div>
        )}
    </div>
  );
}
