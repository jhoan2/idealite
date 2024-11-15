import { TwitterEmbed } from "~/app/workspace/[pageId]/(ResourceInfo)/TwitterEmbed";
import { isTwitterUrl, isYouTubeUrl } from "~/lib/url";
import { Embed } from "~/types/cast";
import { YouTubeEmbed } from "../../(ChannelFeed)/YoutubeEmbed";
import { ImageEmbed } from "./ImageEmbed";
import { LinkPreviewEmbed } from "./LinkPreviewEmbed";
import { EmbeddedCast } from "./EmbeddedCast";

interface CastEmbedProps {
  embed: Embed;
}

export const CastEmbed: React.FC<CastEmbedProps> = ({ embed }) => {
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
        html={metadata.html.oembed?.html}
        title={metadata.html.oembed?.title || "YouTube video"}
      />
    );
  }

  return <LinkPreviewEmbed metadata={metadata} />;
};
