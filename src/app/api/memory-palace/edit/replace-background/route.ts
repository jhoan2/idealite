import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/app/auth";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const imageFile = formData.get("image") as File;
    const backgroundPrompt = formData.get("prompt") as string;

    if (!imageFile || !backgroundPrompt) {
      return NextResponse.json(
        {
          error: "Missing required fields: image and prompt",
        },
        { status: 400 },
      );
    }

    // Get the image data as ArrayBuffer
    const imageArrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);

    // Prepare payload for Stability AI API
    const apiFormData = new FormData();
    apiFormData.append(
      "subject_image",
      new Blob([imageBuffer]),
      imageFile.name,
    );
    apiFormData.append("background_prompt", backgroundPrompt);
    apiFormData.append("output_format", "webp");

    // Make request to Stability AI API
    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/edit/replace-background-and-relight",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STABLE_DIFFUSION_API_KEY}`,
          Accept: "image/*",
        },
        body: apiFormData as any,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Stability AI API error:", errorText);
      return NextResponse.json(
        { success: false, error: "Failed to replace background" },
        { status: response.status },
      );
    }

    // Get the edited image data as ArrayBuffer
    const editedImageArrayBuffer = await response.arrayBuffer();

    // Convert the image data to base64
    const editedImageBuffer = Buffer.from(editedImageArrayBuffer);
    const base64Image = editedImageBuffer.toString("base64");

    return NextResponse.json({
      success: true,
      message: "Background replaced successfully",
      image: `data:image/webp;base64,${base64Image}`,
    });
  } catch (error) {
    console.error("Error in replace background:", error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Failed to process replace background operation" },
      { status: 500 },
    );
  }
}
