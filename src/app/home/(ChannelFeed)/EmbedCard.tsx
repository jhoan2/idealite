import React from "react";
import { Card, CardContent } from "~/components/ui/card";
import { ExternalLink, Link } from "lucide-react";
import { Embed } from "~/types/cast";

interface EmbedCardProps {
  embeds: Embed[];
}

const EmbedCard: React.FC<EmbedCardProps> = ({ embeds }) => {
  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  const getHostname = (url: string): string => {
    try {
      if (!isValidUrl(url)) return "";
      return new URL(url).hostname;
    } catch (e) {
      return "";
    }
  };

  const renderEmbed = (embed: Embed) => {
    const metadata = embed.metadata?.html;
    if (!metadata) return null;

    // Get the main image URL from og:image or twitter:image
    const imageUrl =
      metadata.ogImage?.[0]?.url || metadata.twitterImage?.[0]?.url;

    // Get title and description
    const title = metadata.ogTitle || "";
    const description = metadata.ogDescription || "";
    const favicon = metadata.favicon || "";
    const url = metadata.ogUrl || embed.url || "";
    const hostname = getHostname(url);

    if (!url) return null;

    return (
      <Card key={embed.url} className="max-w-[30rem] overflow-hidden">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3"
        >
          {imageUrl && isValidUrl(imageUrl) && (
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
              <img
                src={imageUrl}
                alt={title}
                className="absolute inset-0 h-full w-full rounded-md object-cover"
              />
            </div>
          )}
          <CardContent className="flex-1 p-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {favicon && isValidUrl(favicon) && (
                <img
                  src={favicon}
                  alt=""
                  width={12}
                  height={12}
                  className="rounded-sm"
                />
              )}
              <span>{hostname || "External Link"}</span>
              <ExternalLink className="h-3 w-3" />
            </div>
            {title && (
              <h3 className="line-clamp-1 text-sm font-medium text-foreground">
                {title}
              </h3>
            )}
          </CardContent>
        </a>
      </Card>
    );
  };

  return (
    <div className="space-y-2">
      {embeds.filter((embed) => embed.url).map((embed) => renderEmbed(embed))}
    </div>
  );
};

export default EmbedCard;
