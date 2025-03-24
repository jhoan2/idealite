import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const imageFile = formData.get("image") as File;
    const searchPrompt = formData.get("search_prompt") as string;
    const prompt = formData.get("prompt") as string;

    if (!imageFile || !searchPrompt || !prompt) {
      return NextResponse.json(
        {
          error: "Missing required fields: image, search_prompt, and prompt",
        },
        { status: 400 },
      );
    }

    // Get the image data as ArrayBuffer
    const imageArrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);

    // Prepare payload for Stability AI API
    const apiFormData = new FormData();
    apiFormData.append("image", new Blob([imageBuffer]), imageFile.name);
    apiFormData.append("prompt", prompt);
    apiFormData.append("search_prompt", searchPrompt);
    apiFormData.append("output_format", "png");

    // Make request to Stability AI API
    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/edit/search-and-replace",
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
        { success: false, error: "Failed to edit image" },
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
      message: "Memory palace image updated successfully",
      image: `data:image/png;base64,${base64Image}`,
    });
  } catch (error) {
    console.error("Error in search and replace:", error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Failed to process search and replace operation" },
      { status: 500 },
    );
  }
}
