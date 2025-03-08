"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

interface TwitterEmbedProps {
  html: string;
}

export function TwitterEmbed({ html }: TwitterEmbedProps) {
  const { theme } = useTheme();
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);
  const centeredHtml = html.replace(
    '<blockquote class="twitter-tweet"',
    `<blockquote class="twitter-tweet" data-theme="${theme}" align="center"`,
  );
  return (
    <div
      dangerouslySetInnerHTML={{ __html: centeredHtml }}
      className="twitter-embed"
    />
  );
}
