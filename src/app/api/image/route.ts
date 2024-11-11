import "server-only";

import { v4 as uuidv4 } from "uuid";
import { NextRequest } from "next/server";
import { auth } from "~/app/auth";
import { db } from "~/server/db";
import { images, users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { updateStorageUsed } from "~/server/actions/storage";

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
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

    const pinataData = await res.json();

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
