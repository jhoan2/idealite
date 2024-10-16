import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  Trash,
  Check,
} from "lucide-react";
import { Cast } from "~/types/cast";
import { useNeynarContext } from "@neynar/react";
import { v4 as uuidv4 } from "uuid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import CastRenderEmbed from "./CastRenderEmbed";
import { Embed } from "~/types/cast";
import Link from "next/link";
interface ChannelFeedCardProps {
  cast: Cast;
}

const ChannelFeedCard: React.FC<ChannelFeedCardProps> = ({ cast }) => {
  const {
    author,
    text,
    timestamp,
    reactions,
    replies,
    hash,
    embeds = [],
    frames = [],
  } = cast;
  const { user } = useNeynarContext();
  const [likes, setLikes] = useState(reactions.likes_count);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const framesUrls = frames.map((frame) => frame.frames_url);
  const filteredEmbeds = embeds.filter(
    (embed) => !framesUrls.includes(embed.url),
  );
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  const deleteCast = async () => {
    if (!user || !user.signer_uuid) {
      console.error("User or signer_uuid not available");
      return;
    }

    try {
      const response = await fetch(`/api/eventCard?eventCastHash=${hash}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signerUuid: user.signer_uuid,
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
    <Card className="mx-auto flex max-w-xl">
      <div className="flex-shrink-0 pl-4 pt-4">
        <Avatar>
          <AvatarImage
            src={cast.author.pfp_url}
            alt={cast.author.display_name}
          />
          <AvatarFallback>{cast.author.display_name.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-grow">
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
                <div className="mt-2">
                  {filteredEmbeds.map((embed, index) => (
                    <CastRenderEmbed key={index} embed={embed as Embed} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between p-2">
          <Link href={`/home/conversation?hash=${hash}`}>
            <Button variant="ghost" size="sm">
              <MessageCircle className="mr-2 h-4 w-4" />
              {replies.count}
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="cursor-default hover:bg-transparent hover:text-inherit"
          >
            <Repeat2 className="mr-2 h-4 w-4" />
            {cast.reactions.recasts_count}
          </Button>
          <Button
            disabled={
              cast.viewer_context.liked ||
              likes === cast.reactions.likes_count + 1
            }
            variant="ghost"
            size="sm"
            onClick={() => likeCast()}
          >
            <Heart
              className={`mr-2 h-4 w-4 ${cast.viewer_context.liked || likes > cast.reactions.likes_count ? "fill-red-500" : ""}`}
            />
            {likes}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const castLink = `https://warpcast.com/${author.username}/${hash}`;
              navigator.clipboard
                .writeText(castLink)
                .then(() => {
                  setIsLinkCopied(true);
                  setTimeout(() => setIsLinkCopied(false), 1000);
                })
                .catch((err) => {
                  console.error("Failed to copy cast link: ", err);
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
    </Card>
  );
};

export default ChannelFeedCard;
