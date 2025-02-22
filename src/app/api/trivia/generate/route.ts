import "server-only";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { generateAndCacheQuestions } from "~/server/services/trivia/generation";
import * as Sentry from "@sentry/nextjs";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
  const { topicName, topicId } = await req.json();

  try {
    // Set lock with 1 hour TTL
    await redis.set(`trivia:generating:${topicName}`, "1", { ex: 3600 });

    await generateAndCacheQuestions(topicName, topicId);

    // Clear lock on success
    await redis.del(`trivia:generating:${topicName}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    // Lock will expire via TTL if we fail
    Sentry.captureException(error);
    throw error; // Let QStash handle retry
  }
}
