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
    await redis.set(`trivia:generating:${topicName}`, "1", { ex: 600 });

    await generateAndCacheQuestions(topicName, topicId);

    // Clear lock on success
    await redis.del(`trivia:generating:${topicName}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    await redis.del(`trivia:generating:${topicName}`);
    Sentry.captureException(error);
    throw error; // Let QStash handle retry
  }
}
