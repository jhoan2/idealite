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

// Pinata API response when uploading a file
export interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate: boolean;
}

export interface ImageResponse {
  image: Image;
  pinataData: PinataUploadResponse;
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
    const file = data.get("file");

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

    // Add metadata for Pinata
    data.append(
      "pinataMetadata",
      JSON.stringify({
        name: uuidv4(),
        keyvalues: {
          userId,
        },
      }),
    );

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: data,
    });

    const pinataData: PinataUploadResponse = await res.json();

    if (!pinataData.IpfsHash) {
      console.log(pinataData, "pinataData");
      return Response.json(
        { error: "Failed to upload image" },

        { status: 500 },
      );
    }

    // Insert the image record
    const [newImage] = await db
      .insert(images)
      .values({
        user_id: userId,
        filename: file.name,
        url: `${pinataData.IpfsHash}`,
        size: fileSize,
      })
      .returning();

    // Update the user's storage usage
    await updateStorageUsed(userId, fileSize);

    return Response.json(
      {
        pinataData: pinataData,
        image: newImage,
      },
      { status: 200 },
    );
  } catch (e) {
    console.log(e);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await currentUser();
  const userId = user?.id;

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

    // Delete from Pinata
    const pinataRes = await fetch(
      `https://api.pinata.cloud/pinning/unpin/${image.url}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      },
    );

    if (!pinataRes.ok && pinataRes.status !== 404) {
      Sentry.captureException(new Error("Failed to delete from Pinata:"), {
        extra: {
          pinataResponse: await pinataRes.text(),
        },
      });
      // Continue with deletion from database even if Pinata fails
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
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
