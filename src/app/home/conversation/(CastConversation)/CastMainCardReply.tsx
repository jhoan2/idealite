import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "~/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { ImageIcon } from "lucide-react";
import { useNeynarContext } from "@neynar/react";
import Image from "next/image";
import { debounce } from "lodash";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import CastRenderEmbed from "../../(ChannelFeed)/CastRenderEmbed";
import { Embed } from "~/types/cast";

interface EmbedForPost extends Embed {
  type: string;
  castData?: {
    cast: {
      author: {
        fid: number;
        pfp_url: string;
        display_name: string;
        username: string;
      };
      hash: string;
      text: string;
      embeds?: Embed[];
    };
  };
  ogData?: {
    ogImage?: { url: string }[];
    ogTitle?: string;
    ogDescription?: string;
  };
}

export default function CastMainCardReply({
  hash,
  author,
}: {
  hash: string;
  author: { fid: number };
}) {
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const { user } = useNeynarContext();
  const [inputImage, setInputImage] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [loadingReply, setLoadingReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [embeds, setEmbeds] = useState<EmbedForPost[]>([]);
  const [isProcessingUrls, setIsProcessingUrls] = useState(false);
  const urlCache = useRef(new Map());

  const fetchData = async (
    url: string,
    fetchFunction: (url: string) => Promise<any>,
  ) => {
    if (urlCache.current.has(url)) {
      return urlCache.current.get(url);
    }
    const data = await fetchFunction(url);
    if (data) {
      urlCache.current.set(url, data);
    }
    return data;
  };

  const fetchWarpcastData = async (url: string) => {
    try {
      const response = await fetch(
        `/api/castCard?url=${encodeURIComponent(url)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Warpcast data");
      }

      const castData = await response.json();
      return {
        url,
        type: "warpcast",
        castData,
      };
    } catch (error) {
      console.error("Error fetching Warpcast data:", error);
      return null;
    }
  };

  const fetchOpenGraphData = async (url: string) => {
    try {
      const response = await fetch(
        `/api/openGraph?url=${encodeURIComponent(url)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch Open Graph data");
      }
      const data = await response.json();
      return {
        url,
        type: "opengraph",
        ogData: data.result,
      };
    } catch (error) {
      console.error("Error fetching Open Graph data:", error);
      return null;
    }
  };

  const pinFileToIPFS = async (file: File) => {
    const formData = new FormData();
    formData.set("file", file);

    try {
      const res = await fetch(`/api/image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      const { pinataData } = data;
      return pinataData;
    } catch (error) {
      console.log((error as Error).message);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = event.clipboardData;
    const item = clipboardData.items[0];
    if (!item) return;

    if (!item.type.startsWith("image/")) {
      const inputElement = document.getElementById("paste-image");
      if (!inputElement) return;
      (inputElement as HTMLInputElement).value = "";
      return;
    }

    const file = item.getAsFile();
    setImage(file);
    const inputElement = document.getElementById("input-image");
    if (inputElement) {
      (inputElement as HTMLInputElement).disabled = true;
    }
  };

  const submitReply = async () => {
    let IpfsHash;
    setLoadingReply(true);

    if (image) {
      const data = await pinFileToIPFS(image);
      IpfsHash = data?.IpfsHash;
    }

    let replyContent: {
      signer_uuid: string;
      text: string;
      embeds: Array<{
        cast_id?: { fid: number; hash: string };
        url?: string;
        type?: string;
        metadata?: { _status: string };
      }>;
      parent: string;
      parent_author_fid: number;
      idem: string;
    } = {
      signer_uuid: user?.signer_uuid || "",
      text: replyText,
      embeds: [],
      parent: hash,
      parent_author_fid: author.fid,
      idem: uuidv4(),
    };

    if (IpfsHash) {
      replyContent.embeds.push({
        url: `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${IpfsHash}`,
      });
    }

    if (embeds.length > 0) {
      embeds.map((embed) => {
        if (embed.type === "warpcast" && embed.castData) {
          replyContent.embeds.push({
            cast_id: {
              fid: embed.castData.cast.author.fid,
              hash: embed.castData.cast.hash,
            },
          });
        } else {
          replyContent.embeds.push({
            url: embed.url,
          });
        }
      });
    }

    try {
      const response = await fetch("/api/castCard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(replyContent),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      const data = await response.json();

      if (data.message === "success") {
        toast.success("Reply sent!");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Error sending reply.");
    } finally {
      setReplyText("");
      setEmbeds([]);
      setLoadingReply(false);
    }
  };

  const processUrls = useCallback(
    debounce(async (urls) => {
      setIsProcessingUrls(true);
      const newEmbeds = await Promise.all(
        urls.map(async (url: string) => {
          if (url.includes("warpcast.com")) {
            return await fetchData(url, fetchWarpcastData);
          } else {
            return await fetchData(url, fetchOpenGraphData);
          }
        }),
      );

      setEmbeds(newEmbeds.filter((embed) => embed !== null));
      setIsProcessingUrls(false);
    }, 500),
    [],
  );

  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = replyText.match(urlRegex) || [];

    const newUrls = urls.filter((url) => !urlCache.current.has(url));

    if (newUrls.length > 0) {
      processUrls(newUrls);
    } else {
      setEmbeds(urls.map((url) => urlCache.current.get(url)).filter(Boolean));
    }
  }, [replyText, processUrls]);

  return (
    <div onClick={() => setIsReplyOpen(true)}>
      <div className="mx-auto mb-4 max-w-xl">
        <Card className="rounded-t-none">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.pfp_url} alt={user?.display_name} />
                <AvatarFallback>{user?.display_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <div className="relative">
                  <Textarea
                    placeholder="Reply to this cast"
                    className={`${isReplyOpen ? "min-h-[100px]" : "min-h-[50px]"} w-full p-2 text-sm`}
                    onPaste={handlePaste}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    maxLength={320}
                  />
                  {embeds.map((embed, index) => (
                    <div key={index} className="mt-2 rounded border shadow-sm">
                      <Card>
                        <CardHeader>
                          {embed.type === "opengraph" &&
                            embed.ogData?.ogImage &&
                            embed.ogData.ogImage.length > 0 && (
                              <img
                                alt="OG Image"
                                className="h-[200px] w-full rounded-t-lg object-cover"
                                height="200"
                                src={embed.ogData?.ogImage[0]?.url}
                                style={{
                                  aspectRatio: "400/200",
                                  objectFit: "cover",
                                }}
                                width="400"
                              />
                            )}
                        </CardHeader>
                        <CardContent>
                          {embed.type === "opengraph" ? (
                            <>
                              <CardTitle>{embed.ogData?.ogTitle}</CardTitle>
                              <CardDescription>
                                {embed.ogData?.ogDescription}
                              </CardDescription>
                            </>
                          ) : (
                            <>
                              <div className="mb-2 flex items-center">
                                <img
                                  src={embed.castData?.cast.author.pfp_url}
                                  alt={embed.castData?.cast.author.display_name}
                                  className="mr-3 h-10 w-10 rounded-full"
                                />
                                <div>
                                  <p className="font-semibold">
                                    {embed.castData?.cast.author.display_name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    @{embed.castData?.cast.author.username}
                                  </p>
                                </div>
                              </div>
                              <p className="mb-2">
                                {embed.castData?.cast.text}
                              </p>
                              {embed.castData?.cast.embeds &&
                                embed.castData.cast.embeds.map(
                                  (nestedEmbed, index) => (
                                    <CastRenderEmbed
                                      key={index}
                                      embed={nestedEmbed}
                                    />
                                  ),
                                )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
                {image && (
                  <div className="relative h-64 w-full">
                    <Image
                      fill
                      style={{ objectFit: "contain" }}
                      src={URL.createObjectURL(image)}
                      alt="Pasted Image"
                      className="max-h-64 max-w-full p-4"
                    />
                  </div>
                )}
                {isReplyOpen ? (
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          setInputImage(!inputImage);
                        }}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <input
                        type="file"
                        id="input-image"
                        onChange={(event) => {
                          const files = event.target.files;
                          setImage(
                            (files && files.length > 0
                              ? files[0]
                              : null) as File | null,
                          );
                        }}
                        className={`${inputImage ? "" : "invisible"} file:inline-flex file:items-center file:gap-x-2 file:rounded-lg file:border file:border-transparent file:bg-blue-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-800 file:hover:bg-blue-200 file:disabled:pointer-events-none file:disabled:opacity-50 file:dark:text-blue-400 file:dark:hover:bg-blue-900 file:dark:focus:outline-none file:dark:focus:ring-1 file:dark:focus:ring-gray-600`}
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2 text-sm text-gray-500">
                        {replyText.length}/320
                      </span>
                      <Button
                        className="bg-blue-500 text-white hover:bg-blue-600"
                        disabled={loadingReply || isProcessingUrls}
                        onClick={() => submitReply()}
                      >
                        {loadingReply
                          ? "Submitting..."
                          : isProcessingUrls
                            ? "Processing URLs..."
                            : "Reply"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
