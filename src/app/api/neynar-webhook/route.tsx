import "server-only";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createHmac } from "crypto";
import { crawlUrl } from "~/server/farcaster";
import { createResourceFromWebhook } from "~/server/actions/resource";
import { cleanUrl } from "~/lib/utils";
import { findResourceByUrl } from "~/server/queries/resource";
import { findUserByFid } from "~/server/queries/user";
import { createPageWithRelationsFromWebhook } from "~/server/actions/page";

const callCreateResourceFromWebhook = async (payload: any) => {
  const resource = await createResourceFromWebhook(payload);
  return resource;
};

const callGetUserByFarcasterId = async (fid: number) => {
  const user = await findUserByFid(fid);
  return user?.id;
};

const fetchThreadReplies = async (
  threadHash: string,
  maxReplies: number = 50,
) => {
  const allReplies = [];

  try {
    let currentHash = threadHash;

    const initialUrl = `https://api.neynar.com/v2/farcaster/cast?identifier=${threadHash}&type=hash`;
    const initialResponse = await fetch(initialUrl, {
      headers: {
        accept: "application/json",
        "x-api-key": process.env.NEYNAR_API_KEY!,
      },
    });

    if (!initialResponse.ok) {
      throw new Error(`Neynar API error: ${initialResponse.status}`);
    }

    const initialData = await initialResponse.json();
    allReplies.push(initialData.cast);

    while (true) {
      if (allReplies.length >= maxReplies) {
        console.warn("Maximum 50 replies limit reached");
        break;
      }

      const url = `https://api.neynar.com/v2/farcaster/cast/conversation?identifier=${currentHash}&type=hash&reply_depth=1&include_chronological_parent_casts=false&limit=5`;

      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          "x-api-key": process.env.NEYNAR_API_KEY!,
        },
      });

      if (!response.ok) {
        throw new Error(`Neynar API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.conversation?.cast.direct_replies) {
        allReplies.push(...data.conversation.cast.direct_replies);
      }

      const lastReply = allReplies[allReplies.length - 1];
      if (!lastReply?.replies?.count) {
        break;
      }

      currentHash = lastReply.hash;
    }

    return allReplies;
  } catch (error) {
    console.error("Error fetching thread:", error);
    throw error;
  }
};

const checkUrlType = async (url: string) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const contentType = response.headers.get("content-type");

    if (contentType?.startsWith("image/")) {
      return {
        type: "image",
        html: `<img src="${url}" alt="Embedded content" />`,
      };
    } else if (contentType?.includes("video/")) {
      return {
        type: "video",
        html: `<video controls src="${url}"></video>`,
      };
    } else if (contentType?.includes("audio/")) {
      return {
        type: "audio",
        html: `<audio controls src="${url}"></audio>`,
      };
    } else {
      return {
        type: "link",
        html: `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
      };
    }
  } catch (error) {
    console.error("Error checking URL:", error);
    // Default to link if check fails
    return {
      type: "link",
      html: `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
    };
  }
};

const processContent = async (contentArray: any) => {
  let htmlString = "";

  for (const item of contentArray) {
    // Process text content
    if (item.text) {
      htmlString += `<p>${item.text}</p>`;
    }

    // Process embeds
    if (item.embeds && item.embeds.length > 0) {
      for (const embed of item.embeds) {
        if (embed.url) {
          const urlContent = await checkUrlType(embed.url);
          htmlString += urlContent.html;
        }
      }
    }
  }

  return htmlString;
};

function extractResourceMetadata(html: any, url: string) {
  // Handle oembed data (typically from Twitter, YouTube)
  if (html?.oembed) {
    return {
      title: html?.oembed?.title || html?.title || "",
      url: url,
      og_type: html?.oembed?.type || html?.type,
      description: html?.oembed?.description || html?.description,
      author: html?.oembed?.author_name || html?.author,
      image: html?.oembed?.thumbnail_url || html?.image,
      date_published:
        html?.oembed?.published_at || html?.date_published
          ? new Date(html?.oembed?.published_at || html?.date_published)
          : undefined,
    };
  }

  return {
    title: html?.ogTitle || "",
    url: url,
    og_type: html?.ogType || "",
    description: html?.ogDescription || "",
    author: html?.author || "",
    image: html?.ogImage?.[0]?.url || html?.image || "",
    date_published: html?.date_published
      ? new Date(html?.date_published)
      : undefined,
  };
}

export async function POST(req: Request) {
  const headersList = headers();
  const body = await req.text();
  const signature = headersList.get("x-neynar-signature");
  if (!signature) {
    throw new Error("Neynar signature missing from request headers");
  }

  const webhookSecret = process.env.NEYNAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error(
      "Make sure you set NEYNAR_WEBHOOK_SECRET in your .env file",
    );
  }

  const hmac = createHmac("sha512", webhookSecret);
  hmac.update(body);

  const generatedSignature = hmac.digest("hex");

  const isValid = generatedSignature === signature;
  if (!isValid) {
    throw new Error("Invalid webhook signature");
  }

  try {
    const payload = JSON.parse(body);
    //Check if the user is a moderator or member
    if (
      payload.data.author_channel_context?.role !== "moderator" &&
      payload.data.author_channel_context?.role !== "member"
    ) {
      return NextResponse.json(
        { message: "Webhook received" },
        { status: 200 },
      );
    }
    //Check if the embeds array is empty
    if (!payload.data.embeds?.length) {
      return NextResponse.json(
        { message: "Webhook received" },
        { status: 200 },
      );
    }

    let html, resourceId;
    const userId = await callGetUserByFarcasterId(
      payload.data.author.fid as number,
    );

    if (
      payload.data.embeds[0].metadata &&
      payload.data.embeds[0].metadata.content_type.includes("text/html")
    ) {
      html = payload.data.embeds[0].metadata.html;
    } else {
      const crawledHtml = await crawlUrl(payload.data.embeds[0].url);
      html = crawledHtml;
    }

    const url = cleanUrl(payload.data.embeds[0].url);
    const resource = await findResourceByUrl(url);
    const threadReplies = await fetchThreadReplies(payload.data.hash);
    const contentString = await processContent(threadReplies);

    if (!resource) {
      const resourceInput = extractResourceMetadata(html, url);
      const resource = await callCreateResourceFromWebhook(resourceInput);
      resourceId = resource?.id;
    } else {
      resourceId = resource.id;
    }

    //Create a page and inside that create the relation from page to resource
    const page = await createPageWithRelationsFromWebhook({
      content_type: "page",
      content: contentString,
      title: html?.ogTitle || html?.oembed?.title || "Untitled",
      resource_id: resourceId,
      user_id: userId,
      primary_tag_id: process.env.ROOT_TAG_ID,
    });

    if (!page.success) {
      console.error("Failed to create page:", {
        resourceId,
        userId,
        page: page,
      });
      return NextResponse.json(
        { message: "Webhook received" },
        { status: 200 },
      );
    }

    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 },
    );
  }
}
