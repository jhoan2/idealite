// src/app/api/image/cloudflare/route.ts
import "server-only";

import { v4 as uuidv4 } from "uuid";
import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { images, users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { updateStorageUsed } from "~/server/actions/storage";
import { ratelimit } from "~/server/ratelimit";
import { type Image } from "~/server/db/schema";
import * as Sentry from "@sentry/nextjs";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Configure Cloudflare R2 client
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

// Cloudflare R2 response when uploading a file
export interface CloudflareUploadResponse {
  key: string;
  url: string;
  size: number;
  etag: string;
}

export interface ImageResponse {
  image: Image;
  cloudflareData: CloudflareUploadResponse;
}

export async function POST(request: NextRequest) {
  const user = await currentUser();
  const userId = user?.externalId;

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const { success } = await ratelimit.limit(userId);

  if (!success) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
    });
  }

  try {
    const data = await request.formData();
    const file = data.get("file") as File;

    if (!file || typeof file !== "object") {
      console.log("No file provided or file input is not of type file.");
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
      });
    }

    if (!file.type.startsWith("image/")) {
      console.log("The provided file is not an image.");
      return new Response(
        JSON.stringify({ error: "The provided file is not an image" }),
        { status: 400 },
      );
    }

    // Get file size in bytes
    const fileSize = file.size;

    // Check user's storage limit
    const [user] = await db
      .select({
        storageUsed: users.storage_used,
        storageLimit: users.storage_limit,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Check if uploading this file would exceed storage limit
    if (user.storageUsed + fileSize > user.storageLimit) {
      return Response.json(
        { error: "Storage limit exceeded" },
        { status: 400 },
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() || "jpg";
    const uniqueKey = `images/${userId}/${uuidv4()}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudflare R2
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key: uniqueKey,
      Body: buffer,
      ContentType: file.type,
      ContentLength: fileSize,
      Metadata: {
        userId: userId,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    const uploadResult = await r2Client.send(uploadCommand);

    if (!uploadResult.ETag) {
      console.log("Failed to upload to Cloudflare R2");
      return Response.json(
        { error: "Failed to upload image" },
        { status: 500 },
      );
    }

    // Generate public URL using environment variable
    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${uniqueKey}`;

    const cloudflareData: CloudflareUploadResponse = {
      key: uniqueKey,
      url: publicUrl,
      size: fileSize,
      etag: uploadResult.ETag.replace(/"/g, ""), // Remove quotes from ETag
    };

    // Insert the image record
    const [newImage] = await db
      .insert(images)
      .values({
        user_id: userId,
        filename: file.name,
        url: uniqueKey, // Store the key for deletion
        size: fileSize,
      })
      .returning();

    // Update the user's storage usage
    await updateStorageUsed(userId, fileSize);

    return Response.json(
      {
        cloudflareData: cloudflareData,
        image: newImage,
      },
      { status: 200 },
    );
  } catch (e) {
    console.log(e);
    Sentry.captureException(e);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await currentUser();
  const userId = user?.externalId;

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the image ID from the URL or request body
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("id");

    if (!imageId) {
      return Response.json({ error: "Image ID is required" }, { status: 400 });
    }

    // Find the image and verify ownership
    const [image] = await db
      .select()
      .from(images)
      .where(eq(images.id, imageId));

    if (!image) {
      return Response.json({ error: "Image not found" }, { status: 404 });
    }

    if (image.user_id !== userId) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete from Cloudflare R2
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
        Key: image.url, // The key is stored in the url field
      });

      await r2Client.send(deleteCommand);
    } catch (r2Error) {
      console.error("Failed to delete from Cloudflare R2:", r2Error);
      Sentry.captureException(r2Error, {
        extra: {
          imageId: image.id,
          key: image.url,
        },
      });
      // Continue with deletion from database even if R2 fails
    }

    // Delete from database
    await db.delete(images).where(eq(images.id, imageId));

    // Update user's storage quota by subtracting the image size
    await updateStorageUsed(userId, -image.size);

    return Response.json(
      {
        success: true,
        message: "Image deleted successfully",
      },
      { status: 200 },
    );
  } catch (e) {
    console.error("Error deleting image:", e);
    Sentry.captureException(e);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
