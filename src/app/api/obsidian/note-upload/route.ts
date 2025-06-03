// app/api/obsidian/note-upload/route.ts - Enhanced with rate limiting and CORS
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { Client } from "@upstash/workflow";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { validateCredential } from "~/lib/integrations/validate";
import {
  uploadTempFileToPinata,
  uploadTempFilesToPinata,
} from "~/lib/pinata/uploadTempFiles";
import * as Sentry from "@sentry/nextjs";

// CORS headers function - now only used for error responses
function setCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  response.headers.set(
    "Access-Control-Expose-Headers",
    "Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Daily-Remaining, X-RateLimit-Minute-Remaining",
  );
  return response;
}

// Simple rate limiters optimized for Obsidian batch upload use case
const uploadRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(40, "60 s"), // 40 uploads per minute
  analytics: true,
  prefix: "@upstash/ratelimit/uploads",
});

const dailyUploadLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(1000, "24 h"), // 1000 uploads per day
  analytics: true,
  prefix: "@upstash/ratelimit/daily",
});

// File size limits
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB per file
const MAX_TOTAL_IMAGES_SIZE = 50 * 1024 * 1024; // 50MB total for images

// Authenticate user by API token
async function authenticateUser(
  authHeader: string | null,
): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const credential = await validateCredential("obsidian", token);
    return credential?.user_id || null;
  } catch (error) {
    console.error("Error authenticating user:", error);
    return null;
  }
}

// Simple rate limit check
async function checkRateLimits(userId: string) {
  const identifier = `user:${userId}`;

  // Check daily limit first
  const { success: dailyOk, remaining: dailyRemaining } =
    await dailyUploadLimit.limit(identifier);

  if (!dailyOk) {
    return {
      success: false,
      error: "Daily upload limit exceeded (1000 files/day)",
      details: {
        type: "daily_limit",
        remaining: dailyRemaining,
        resetTime: "24 hours",
      },
    };
  }

  // Check per-minute rate limit
  const {
    success: rateOk,
    remaining: rateRemaining,
    reset,
  } = await uploadRatelimit.limit(identifier);

  if (!rateOk) {
    return {
      success: false,
      error: "Upload rate limit exceeded (40 files/minute)",
      details: {
        type: "rate_limit",
        remaining: rateRemaining,
        resetTime: reset ? new Date(reset).toISOString() : "1 minute",
      },
    };
  }

  return {
    success: true,
    details: {
      dailyRemaining,
      minuteRemaining: rateRemaining,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const userId = await authenticateUser(req.headers.get("Authorization"));
    if (!userId) {
      const response = NextResponse.json(
        { error: "Unauthorized: Invalid or missing API token" },
        { status: 401 },
      );
      return setCorsHeaders(response);
    }

    const form = await req.formData();
    const mdFile = form.get("markdown") as File;
    const frontMatterJson = form.get("frontMatter") as string;
    const imageFiles = form.getAll("images[]") as File[];

    if (!mdFile) {
      const response = NextResponse.json(
        { error: "Markdown file missing" },
        { status: 400 },
      );
      return setCorsHeaders(response);
    }

    // Validate file sizes
    if (mdFile.size > MAX_FILE_SIZE) {
      const response = NextResponse.json(
        {
          error: "Markdown file too large",
          maxSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 413 },
      );
      return setCorsHeaders(response);
    }

    const totalImageSize = imageFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalImageSize > MAX_TOTAL_IMAGES_SIZE) {
      const response = NextResponse.json(
        {
          error: "Total image size too large",
          maxSize: `${MAX_TOTAL_IMAGES_SIZE / 1024 / 1024}MB`,
        },
        { status: 413 },
      );
      return setCorsHeaders(response);
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimits(userId);
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          error: rateLimitResult.error,
          rateLimit: rateLimitResult.details,
          retryAfter: rateLimitResult.details.resetTime,
        },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": "40",
            "X-RateLimit-Remaining":
              rateLimitResult.details.remaining?.toString() || "0",
          },
        },
      );
      return setCorsHeaders(response);
    }

    // Parse front matter
    let frontMatter: Record<string, any> | null = null;
    if (frontMatterJson) {
      try {
        frontMatter = JSON.parse(frontMatterJson);
      } catch (error) {
        const response = NextResponse.json(
          { error: "Invalid frontMatter JSON" },
          { status: 400 },
        );
        return setCorsHeaders(response);
      }
    }

    // Upload files to IPFS
    const markdownUpload = await uploadTempFileToPinata(
      mdFile,
      mdFile.name,
      userId,
    );
    const imageUploads = await uploadTempFilesToPinata(
      imageFiles.map((file) => ({ file, name: file.name })),
      userId,
    );

    // Start workflow
    const client = new Client({ token: process.env.QSTASH_TOKEN! });
    const { workflowRunId } = await client.trigger({
      url: `${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}/api/workflows/obsidian-upload`,
      body: {
        userId,
        fileName: mdFile.name,
        fileSize: mdFile.size,
        markdownCid: markdownUpload.cid,
        markdownAccessUrl: markdownUpload.accessUrl,
        markdownAccessExpires: markdownUpload.accessExpiresAt.toISOString(),
        imageData: imageUploads.map((upload) => ({
          cid: upload.cid,
          name: upload.name,
          size: upload.size,
          isTemp: upload.isTemp,
          accessUrl: upload.accessUrl,
          accessExpiresAt: upload.accessExpiresAt.toISOString(),
        })),
        frontMatter,
      },
    });

    // Note: CORS headers are now handled by middleware, no need to set them here for success responses
    const response = NextResponse.json(
      {
        success: true,
        workflowRunId,
        status: "RUNNING",
        message: "Files uploaded to Private IPFS, workflow started",
        filesUploaded: {
          markdown: {
            cid: markdownUpload.cid,
            size: markdownUpload.size,
            accessExpiresAt: markdownUpload.accessExpiresAt,
          },
          images: imageUploads.map((img) => ({
            cid: img.cid,
            name: img.name,
            size: img.size,
            accessExpiresAt: img.accessExpiresAt,
          })),
        },
        rateLimit: {
          dailyRemaining: rateLimitResult.details.dailyRemaining,
          minuteRemaining: rateLimitResult.details.minuteRemaining,
        },
      },
      {
        headers: {
          "X-RateLimit-Daily-Remaining":
            rateLimitResult.details.dailyRemaining?.toString() || "0",
          "X-RateLimit-Minute-Remaining":
            rateLimitResult.details.minuteRemaining?.toString() || "0",
        },
      },
    );

    return response; // Middleware will handle CORS headers
  } catch (error) {
    Sentry.captureException(error, {
      tags: { action: "obsidian-note-upload" },
    });
    const response = NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
    return setCorsHeaders(response);
  }
}
