import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST() {
  try {
    // Use SCAN instead of KEYS to handle large datasets
    let cursor = 0;
    let allKeys: string[] = [];

    do {
      // Scan for keys matching the pattern with a reasonable count
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: "trivia*",
        count: 100,
      });

      cursor = Number(nextCursor);
      allKeys = allKeys.concat(keys as string[]);
    } while (cursor !== 0);

    if (allKeys.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: "No trivia keys found",
      });
    }

    // Delete all the keys in batches
    const BATCH_SIZE = 50;
    const batches = [];

    for (let i = 0; i < allKeys.length; i += BATCH_SIZE) {
      const batch = allKeys.slice(i, i + BATCH_SIZE);
      const pipeline = redis.pipeline();

      batch.forEach((key) => {
        pipeline.del(key);
      });

      batches.push(pipeline.exec());
    }

    await Promise.all(batches);

    return NextResponse.json({
      success: true,
      deletedCount: allKeys.length,
      message: `Successfully deleted ${allKeys.length} trivia keys`,
    });
  } catch (error) {
    console.error("Error deleting trivia keys:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
