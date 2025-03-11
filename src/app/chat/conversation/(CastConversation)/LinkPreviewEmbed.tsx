import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { getHostname, isValidUrl } from "~/lib/url";

interface LinkPreviewEmbedProps {
  metadata: {
    html: {
      ogImage?: Array<{ url: string }>;
      twitterImage?: Array<{ url: string }>;
      ogTitle?: string;
      ogUrl?: string;
      favicon?: string;
    };
  };
  url?: string;
}

export const LinkPreviewEmbed: React.FC<LinkPreviewEmbedProps> = ({
  metadata,
  url,
}) => {
  const imageUrl =
    metadata.html?.ogImage?.[0]?.url || metadata.html?.twitterImage?.[0]?.url;
  const title = metadata.html?.ogTitle || "";
  const favicon = metadata.html?.favicon || "";
  const linkUrl = metadata.html?.ogUrl || url || "";
  const hostname = getHostname(linkUrl);

  if (!linkUrl) return null;

  return (
    <Card className="max-w-[30rem] overflow-hidden">
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50"
      >
        {imageUrl && isValidUrl(imageUrl) && (
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
            <img
              src={imageUrl}
              alt={title}
              className="absolute inset-0 h-full w-full rounded-md object-cover"
              loading="lazy"
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
                loading="lazy"
              />
            )}
            <span>{hostname || "External Link"}</span>
            <ExternalLink className="h-3 w-3" />
          </div>
          {title && (
            <h3 className="line-clamp-2 text-sm font-medium text-foreground">
              {title}
            </h3>
          )}
        </CardContent>
      </a>
    </Card>
  );
};
