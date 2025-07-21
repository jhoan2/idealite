"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  BookIcon,
  LinkIcon,
  MicroscopeIcon,
  CalendarIcon,
  UserIcon,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { TwitterEmbed } from "./TwitterEmbed";

export interface InfoCardProps {
  type: string;
  title: string;
  image: string;
  description: string;
  url: string;
  date_published: Date | null;
  author: string | null;
  resourceId: string;
  pageId: string;
  onDelete: (resourceId: string, pageId: string) => void;
}

export function InfoCard({
  type,
  title,
  image,
  description,
  url,
  date_published,
  author,
  resourceId,
  pageId,
  onDelete,
}: InfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [twitterHtml, setTwitterHtml] = useState("");

  const isTwitterUrl = (url: string) => {
    return url.includes("twitter.com") || url.includes("x.com");
  };

  useEffect(() => {
    const fetchTwitterEmbed = async () => {
      if (isTwitterUrl(url)) {
        setIsLoading(true);
        try {
          const response = await fetch(
            `/api/twitter?url=${encodeURIComponent(url)}`,
          );
          const data = await response.json();
          setTwitterHtml(data.html);
        } catch (error) {
          console.error("Error fetching Twitter embed:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchTwitterEmbed();
  }, [url]);

  if (isTwitterUrl(url)) {
    if (isLoading) {
      return <div>Loading tweet...</div>;
    }
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between space-x-2">
            <div className="flex min-w-0 items-center space-x-2">
              {type === "url" ? (
                <LinkIcon className="h-5 w-5 flex-shrink-0 text-primary" />
              ) : type === "book" ? (
                <BookIcon className="h-5 w-5 flex-shrink-0 text-primary" />
              ) : type === "research-paper" ? (
                <MicroscopeIcon className="h-5 w-5 flex-shrink-0 text-primary" />
              ) : (
                <LinkIcon className="h-5 w-5 flex-shrink-0 text-primary" />
              )}
              <span className="truncate text-sm text-muted-foreground">
                {type}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(resourceId, pageId)}
              className="h-6 w-6 flex-shrink-0 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <TwitterEmbed html={twitterHtml || ""} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between space-x-2">
          <div className="flex min-w-0 flex-1 items-center space-x-2">
            {type === "url" ? (
              <LinkIcon className="h-5 w-5 flex-shrink-0 text-primary" />
            ) : type === "book" ? (
              <BookIcon className="h-5 w-5 flex-shrink-0 text-primary" />
            ) : type === "research-paper" ? (
              <MicroscopeIcon className="h-5 w-5 flex-shrink-0 text-primary" />
            ) : (
              <LinkIcon className="h-5 w-5 flex-shrink-0 text-primary" />
            )}
            <span className="truncate text-sm text-muted-foreground">
              {type}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(resourceId, pageId)}
            className="h-6 w-6 flex-shrink-0 rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-[160px_1fr] gap-4 overflow-hidden">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative h-[90px] w-[160px] flex-shrink-0 overflow-hidden rounded-md"
        >
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-all duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/10" />
        </a>
        <div className="min-w-0 space-y-2 overflow-hidden">
          <CardTitle className="break-words text-xl font-bold leading-tight">
            {title}
          </CardTitle>
          <div className="space-y-1">
            <span
              className={
                !isExpanded
                  ? "line-clamp-2 break-words text-sm text-muted-foreground"
                  : "break-words text-sm text-muted-foreground"
              }
            >
              {description}
            </span>
            {description && description.length > 100 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-primary"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>
                    Show less
                    <ChevronUp className="ml-1 h-3 w-3" />
                  </>
                ) : (
                  <>
                    Show more
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 overflow-hidden">
            {author && (
              <div className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{author}</span>
              </div>
            )}
            {date_published && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                <span className="whitespace-nowrap">
                  {new Date(date_published).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default InfoCard;
