import React, { useState, useEffect } from "react";
import Hls from "hls.js";
import CastOpenGraph from "./CastOpenGraph";
import { Cast, Embed } from "~/types/cast";

export default function CastRenderEmbed({ embed }: { embed: Embed }) {
  const [castData, setCastData] = useState<Cast | null>(null);

  const fetchCastData = async (hash: string) => {
    try {
      const response = await fetch(`/api/castCard?hash=${hash}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch cast data");
      }

      const data = await response.json();
      console.log(data);
      setCastData(data.cast);
    } catch (error) {
      console.error("Error fetching cast data:", error);
    }
  };

  const ImageWrapper = ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => (
    <img
      src={src}
      alt={alt}
      className={`my-2.5 block h-auto max-h-[150px] w-auto max-w-full rounded-lg border border-gray-300 object-cover ${className}`}
    />
  );

  //   const NativeVideoPlayer = ({ url }: { url: string }) => {
  //     const videoRef = React.useRef(null);

  //     React.useEffect(() => {
  //       if (videoRef.current) {
  //         if (Hls.isSupported() && url.endsWith(".m3u8")) {
  //           const hls = new Hls();
  //           hls.loadSource(url);
  //           hls.attachMedia(videoRef.current);
  //           hls.on(Hls.Events.MANIFEST_PARSED, () => {
  //             videoRef.current.play();
  //           });
  //         } else {
  //           videoRef.current.src = url;
  //           videoRef.current.addEventListener("loadedmetadata", () => {
  //             videoRef.current.play();
  //           });
  //         }
  //       }
  //     }, [url]);

  //     return (
  //       <video
  //         ref={videoRef}
  //         controls
  //         muted={true}
  //         className="my-2.5 max-h-[400px] w-auto max-w-full rounded-lg object-contain"
  //       />
  //     );
  //   };

  const isImageUrl = (url: string) => {
    return (
      /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/.test(url) ||
      url.startsWith("https://imagedelivery.net")
    );
  };

  useEffect(() => {
    if (embed.cast_id) {
      fetchCastData(embed.cast_id.hash);
    }
  }, [embed]);

  const renderEmbed = () => {
    if (embed.cast_id && castData) {
      return (
        <div className="my-2.5 rounded-lg border border-gray-300 p-4">
          <div className="mb-2 flex items-center">
            <img
              src={castData.author.pfp_url}
              alt={castData.author.display_name}
              className="mr-3 h-10 w-10 rounded-full"
            />
            <div>
              <p className="font-semibold">{castData.author.display_name}</p>
              <p className="text-sm text-gray-500">
                @{castData.author.username}
              </p>
            </div>
          </div>
          <p className="mb-2">{castData.text}</p>
          {castData.embeds && castData.embeds.length > 0 && (
            <div className="mt-2">
              {castData.embeds.map((embed, index) => (
                <CastRenderEmbed key={index} embed={embed} />
              ))}
            </div>
          )}
        </div>
      );
    } else if (embed.url) {
      const url = embed.url;
      if (isImageUrl(url)) {
        return <ImageWrapper key={url} src={url} alt="Embedded image" />;
      } else if (url.endsWith(".m3u8") || url.endsWith(".mp4")) {
        // return <NativeVideoPlayer key={url} url={url} />;
        return <></>;
      } else {
        return <CastOpenGraph embed={embed} />;
      }
    }
  };

  return renderEmbed();
}
