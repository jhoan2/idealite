import { Redis } from "@upstash/redis";

// Create Redis client
let redis: Redis | null = null;

// Initialize Redis client
export const getFlashcardRedisClient = () => {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || "",
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    });
  }
  return redis;
};

// Queue names
export const FLASHCARD_QUEUE = "flashcard-generation-queue";

export const JOB_QUEUE_TTL = 60 * 60 * 24; // 24 hours
export const JOB_RESULT_TTL = 60 * 60 * 24 * 7; // 7 days

// Add card generation job to queue
export async function queueFlashcardGeneration(jobData: FlashcardJobData) {
  const redis = getFlashcardRedisClient();
  const jobId = `flashcard-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  await redis.lpush(
    FLASHCARD_QUEUE,
    JSON.stringify({
      id: jobId,
      data: jobData,
      status: "pending",
      createdAt: new Date().toISOString(),
    }),
  );

  return jobId;
}

// Types for queue data
export interface FlashcardJobData {
  userId: string;
  pageId: string;
  content: string;
  type: "question-answer" | "cloze";
  tagIds?: string[];
}

export interface QueuedFlashcardJob {
  id: string;
  data: FlashcardJobData;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  processedAt?: string;
  error?: string;
}
