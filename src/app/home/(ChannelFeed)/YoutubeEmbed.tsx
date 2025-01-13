import React from "react";
import { Card } from "~/components/ui/card";

interface YouTubeEmbedProps {
  html: string;
  title: string;
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ html, title }) => {
  const srcMatch = html.match(/src="([^"]+)"/);
  const src = srcMatch ? srcMatch[1] : "";

  return (
    <Card className="max-w-[30rem] overflow-hidden">
      <div className="relative aspect-video">
        <iframe
          src={src}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </Card>
  );
};
