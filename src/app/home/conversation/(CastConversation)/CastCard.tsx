"use client";

import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Heart, Share, Check, Trash, ChevronDown } from "lucide-react";
import { Cast, Embed } from "~/types/cast";
import { formatDistanceToNow } from "date-fns";
import { useNeynarContext } from "@neynar/react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import { v4 as uuidv4 } from "uuid";
import CastMainCardReply from "./CastMainCardReply";
import CastSubCardReply from "./CastSubCardReply";
import { CastHeader } from "./CastHeader";
import { CastEmbed } from "./CastEmbed";

interface CastCardProps {
  cast: Cast;
  isLastInBranch: boolean;
  isTopLevel: boolean;
  onShowMoreReplies: (cursor: string) => void;
}

const CastCard: React.FC<CastCardProps> = ({
  cast,
  isLastInBranch,
  isTopLevel,
  onShowMoreReplies,
}) => {
  const {
    author,
    text,
    timestamp,
    reactions,
    replies,
    hash,
    viewer_context,
    embeds = [],
    frames = [],
  } = cast;
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [likes, setLikes] = useState(cast.reactions.likes_count);
  const { user } = useNeynarContext();
  const framesUrls = frames.map((frame) => frame.frames_url);
  const filteredEmbeds: Embed[] = embeds.filter(
    (embed) => !framesUrls.includes(embed.url),
  );

  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  const deleteCast = async () => {
    if (!user || !user.signer_uuid) {
      console.error("User or signer_uuid not available");
      return;
    }

    try {
      const response = await fetch(`/api/castCard?eventCastHash=${hash}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signer_uuid: user.signer_uuid,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete cast");
      }

      toast.success("Deleted cast");
    } catch (error) {
      console.error("Error deleting cast:", error);
      toast.error("Error deleting cast.");
    }
  };

  const likeCast = async () => {
    if (!user || !user.signer_uuid) {
      console.error("User or signer_uuid not available");
      return;
    }

    try {
      const response = await fetch("/api/castCard", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reaction_type: "like",
          signer_uuid: user.signer_uuid,
          target: hash,
          target_author_fid: author.fid,
          idem: uuidv4(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to like cast");
      }

      const data = await response.json();

      if (data.success) {
        setLikes(likes + 1);
      }
    } catch (error) {
      console.error("Error liking cast:", error);
      toast.error("Error liking cast");
    }
  };

  const parseTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-500 hover:underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div>
      <Card className="mx-auto max-w-xl">
        <div className="flex">
          <CastHeader
            author={author}
            isLastInBranch={isLastInBranch}
            isTopLevel={isTopLevel}
          />
          <div className="flex-grow flex-col">
            <CardContent className="p-2">
              <div className="flex">
                <div className="w-full">
                  <div className="flex justify-between">
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold">{author.display_name}</p>
                      <p className="text-sm text-gray-500">
                        @{author.username} · {timeAgo}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-more-horizontal h-4 w-4"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-44">
                        <DropdownMenuRadioGroup>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteCast()}
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-red-600 outline-none transition-colors focus:bg-red-100 focus:text-red-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-800 dark:focus:text-slate-50"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="mt-2">{parseTextWithLinks(text)}</p>
                  {filteredEmbeds.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {filteredEmbeds.map((embed, index) => {
                        return <CastEmbed embed={embed} key={index} />;
                      })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between p-2">
              <CastSubCardReply
                author={author}
                replies={replies}
                timeAgo={timeAgo}
                text={text}
                hash={hash}
              />
              <Button
                disabled={
                  viewer_context.liked ||
                  likes === cast.reactions.likes_count + 1
                }
                variant="ghost"
                size="sm"
                onClick={() => likeCast()}
              >
                <Heart
                  className={`mr-2 h-4 w-4 ${viewer_context.liked || likes > reactions.likes_count ? "fill-red-500" : ""}`}
                />
                {likes}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard
                    .writeText(window.location.href)
                    .then(() => {
                      setIsLinkCopied(true);
                      setTimeout(() => setIsLinkCopied(false), 1000);
                    })
                    .catch((err) => {
                      console.error("Failed to copy link: ", err);
                    });
                }}
              >
                {isLinkCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Share className="h-4 w-4" />
                )}
              </Button>
            </CardFooter>
          </div>
        </div>
        {isLastInBranch && replies.count > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-gray-500"
            onClick={() => onShowMoreReplies(hash)}
          >
            <ChevronDown className="mr-2 h-4 w-4" />
            Show more replies
          </Button>
        )}
      </Card>
      {isTopLevel ? <CastMainCardReply hash={hash} author={author} /> : null}
    </div>
  );
};

export default CastCard;
