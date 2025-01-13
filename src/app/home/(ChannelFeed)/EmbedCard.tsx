import React from "react";
import { Embed } from "~/types/cast";
import { TwitterEmbed } from "~/app/workspace/[pageId]/(ResourceInfo)/TwitterEmbed";
import { YouTubeEmbed } from "./YoutubeEmbed";
import { isYouTubeUrl, isTwitterUrl } from "~/lib/url";
import { ImageEmbed } from "../conversation/(CastConversation)/ImageEmbed";
import { EmbeddedCast } from "../conversation/(CastConversation)/EmbeddedCast";
import { LinkPreviewEmbed } from "../conversation/(CastConversation)/LinkPreviewEmbed";

interface EmbedCardProps {
  embeds: Embed[];
}

const EmbedCard: React.FC<EmbedCardProps> = ({ embeds }) => {
  const renderEmbed = (embed: Embed) => {
    if ("cast_id" in embed && embed.cast) {
      return <EmbeddedCast cast={embed.cast} />;
    }
    const metadata = embed.metadata;
    if (!metadata) return null;

    if (embed.metadata?.content_type?.startsWith("image/") && embed.url) {
      return <ImageEmbed url={embed.url} />;
    }

    if (isTwitterUrl(embed.url || "")) {
      const twitterHtml = metadata.html.oembed?.html;
      if (twitterHtml && typeof twitterHtml === "string") {
        return <TwitterEmbed html={twitterHtml} />;
      }
    }

    if (isYouTubeUrl(embed.url || "") && metadata.html.oembed?.html) {
      return (
        <YouTubeEmbed
          html={metadata.html.oembed.html}
          title={metadata.html.oembed.title || "YouTube video"}
        />
      );
    }

    return <LinkPreviewEmbed metadata={metadata} url={embed.url} />;
  };

  return (
    <div className="space-y-2">
      {embeds.map((embed, index) => (
        <div key={index}>{renderEmbed(embed)}</div>
      ))}
    </div>
  );
};

export default EmbedCard;
