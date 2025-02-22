import "server-only";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Client } from "@upstash/qstash";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

export async function POST(req: Request) {
  try {
    const { topicName, topicId } = await req.json();
    const pattern = `trivia:${topicName}:*`;

    // Check cache and lock atomically
    const keys = await redis.keys(pattern);
    const isGenerating = await redis.get(`trivia:generating:${topicName}`);

    if (keys.length < 150 && !isGenerating) {
      const BASE_URL =
        //comment NEXT_PUBLIC_DEPLOYMENT_URL out for local testing with ngrok
        process.env.NEXT_PUBLIC_DEPLOYMENT_URL ??
        "99e4-2601-646-8900-8b60-2864-1002-4368-e3ed.ngrok-free.app";

      if (!BASE_URL) {
        console.error("Missing BASE_URL environment variable");
        return NextResponse.json(
          { success: false, error: "Server configuration error" },
          { status: 500 },
        );
      }

      const domain = `https://${BASE_URL}`;
      const destinationUrl = `${domain}/api/trivia/generate`;
      await qstash.publish({
        url: destinationUrl,
        body: JSON.stringify({ topicName, topicId }),
        retries: 3,
        deadline: "1h",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in trivia cache endpoint:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
