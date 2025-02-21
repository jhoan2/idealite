import "server-only";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { generateAndCacheQuestions } from "~/server/services/trivia/generation";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
  const { topic } = await req.json();
  const pattern = `trivia:${topic}:*`;

  const keys = await redis.keys(pattern);

  if (keys.length < 150) {
    generateAndCacheQuestions(topic);
  }

  return NextResponse.json({ success: true });
}
