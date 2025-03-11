import React, { useState, useEffect } from "react";
import { Embed } from "~/types/cast";
import { OpenGraphData } from "~/types/opengraph";

const StyledLink = ({
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: React.ReactNode;
}) => (
  <a
    className="flex items-center gap-2 break-words rounded-lg border border-gray-300 p-2 text-current no-underline"
    {...props}
  >
    {children}
  </a>
);

export default function CastOpenGraph({ embed }: { embed: Embed }) {
  const [openGraphData, setOpenGraphData] = useState<OpenGraphData | null>(
    null,
  );
  const openGraphCache = new Map<string, OpenGraphData>();
  const pendingRequests = new Map<string, Promise<OpenGraphData>>();
  const domainErrorTracker = new Map<string, boolean>();

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const fetchOpenGraphData = async (
    url: string,
    retryCount = 0,
  ): Promise<OpenGraphData> => {
    const domain = new URL(url).hostname;

    if (domainErrorTracker.get(domain)) {
      return { ogImage: [], ogTitle: "", ogDescription: "" };
    }

    if (openGraphCache.has(url)) {
      return openGraphCache.get(url)!;
    }

    if (pendingRequests.has(url)) {
      return pendingRequests.get(url)!;
    }

    const fetchPromise = async () => {
      try {
        await delay(100);
        const response = await fetch(
          `/api/openGraph?url=${encodeURIComponent(url)}`,
          { method: "GET" },
        );
        if (!response.ok) {
          if (response.status === 429 && retryCount < 5) {
            const backoff = Math.pow(2, retryCount) * 1000;
            await delay(backoff);
            return fetchOpenGraphData(url, retryCount + 1);
          }
          domainErrorTracker.set(domain, true);
          throw new Error(
            `Failed to fetch Open Graph data: ${response.statusText}`,
          );
        }
        const data = await response.json();
        const { ogImage = [], ogTitle = "", ogDescription = "" } = data.result;

        const openGraphData: OpenGraphData = {
          ogImage,
          ogTitle,
          ogDescription,
        };
        openGraphCache.set(url, openGraphData);
        return openGraphData;
      } catch (error) {
        console.error("Error fetching Open Graph data", error);
        if (error instanceof Error && error.message.includes("500")) {
          console.error(
            "Server error occurred. Check server logs for more details.",
          );
        }
        return { ogImage: [], ogTitle: "", ogDescription: "" };
      } finally {
        pendingRequests.delete(url);
      }
    };

    pendingRequests.set(url, fetchPromise());
    return fetchPromise();
  };

  useEffect(() => {
    if (embed && embed.url) {
      fetchOpenGraphData(embed.url).then(setOpenGraphData);
    }
  }, [embed]);

  if (!openGraphData) {
    return null;
  }

  return (
    <StyledLink href={embed.url} target="_blank" rel="noreferrer">
      {openGraphData.ogImage && openGraphData.ogImage[0] && (
        <img
          src={openGraphData.ogImage[0].url}
          alt={openGraphData.ogTitle || ""}
          className="h-[50px] w-[50px] rounded-md object-cover"
        />
      )}
      <div
        style={{ display: "flex", flexDirection: "column", marginLeft: "10px" }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <p className="m-0">{openGraphData.ogTitle || embed.url}</p>
        </div>
        <p className="m-0 text-xs text-gray-500">
          {embed.url ? new URL(embed.url).hostname.replace("www.", "") : ""}
        </p>
      </div>
    </StyledLink>
  );
}
