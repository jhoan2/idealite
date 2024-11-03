"use client";

import { useEffect } from "react";

interface TwitterEmbedProps {
  html: string;
}

export function TwitterEmbed({ html }: TwitterEmbedProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: html }} className="twitter-embed" />
  );
}
