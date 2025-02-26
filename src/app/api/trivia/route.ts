import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import * as Sentry from "@sentry/nextjs";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(req: Request) {
  try {
    // Get topic from URL params
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic");
    const countParam = searchParams.get("count");

    if (!topic) {
      return NextResponse.json(
        { success: false, error: "Topic is required" },
        { status: 400 },
      );
    }

    let count = 20; // Default count
    if (countParam) {
      const parsedCount = parseInt(countParam, 10);
      if (!isNaN(parsedCount) && parsedCount > 0) {
        count = Math.min(parsedCount, 10); // Cap at 10
      }
    }

    const pattern = `trivia:${topic}:*`;

    const keys = await redis.keys(pattern);

    if (keys.length === 0) {
      return [];
    }

    const values = await redis.mget(...keys);
    // Cap count to available questions
    count = Math.min(count, values.length);

    // Select random questions
    const selectedQuestions = [];
    const usedIndices = new Set();

    while (selectedQuestions.length < count) {
      const randomIndex = Math.floor(Math.random() * values.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        selectedQuestions.push(values[randomIndex]);
      }
    }

    return NextResponse.json({
      success: true,
      data: selectedQuestions,
    });
  } catch (error) {
    console.error("Error retrieving questions:", error);
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
