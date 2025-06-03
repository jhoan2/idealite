import { Client } from "@upstash/qstash";
import {
  getFlashcardRedisClient,
  FLASHCARD_QUEUE,
  QueuedFlashcardJob,
  FlashcardJobData,
} from "./flashcard-queue";

// Initialize QStash client
let qstashClient: Client | null = null;

export const getFlashcardQStashClient = () => {
  if (!qstashClient) {
    qstashClient = new Client({
      token: process.env.QSTASH_TOKEN || "",
    });
  }
  return qstashClient;
};

// Process next job in the flashcard queue
export async function processNextFlashcardJob() {
  const redis = getFlashcardRedisClient();

  // Get the next job from the queue
  const jobData = await redis.rpop(FLASHCARD_QUEUE);
  if (!jobData) {
    return null; // No jobs in queue
  }

  // Handle both cases - when jobData is already an object or when it's a string
  let job: QueuedFlashcardJob;
  if (typeof jobData === "string") {
    try {
      job = JSON.parse(jobData) as QueuedFlashcardJob;
    } catch (e) {
      console.error("Failed to parse job data:", e);
      return null;
    }
  } else {
    job = jobData as QueuedFlashcardJob;
  }

  // Update job status to processing
  job.status = "processing";

  try {
    // Send to QStash with retry configuration
    const client = getFlashcardQStashClient();
    await client.publishJSON({
      url: `${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}/api/process-flashcard-job`,
      body: job,
      retries: 3, // Retry up to 3 times
      delay: 15, // 15 second delay between retries
    });

    return job;
  } catch (error) {
    console.error("Failed to queue flashcard job in QStash:", error);

    // Update job status to failed
    job.status = "failed";
    job.error = error instanceof Error ? error.message : String(error);

    // Put the job back in the queue for later retry
    await redis.lpush(FLASHCARD_QUEUE, JSON.stringify(job));

    return null;
  }
}
