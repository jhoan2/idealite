import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 },
      );
    }

    // Prepare payload for Stable Diffusion API
    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("output_format", "png");

    // Make request to Stable Diffusion API
    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/generate/core",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STABLE_DIFFUSION_API_KEY}`,
          Accept: "image/*",
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Stable Diffusion API error:", errorText);
      return NextResponse.json(
        { success: false, error: "Failed to generate image" },
        { status: response.status },
      );
    }

    // Get the image data as ArrayBuffer
    const imageArrayBuffer = await response.arrayBuffer();

    // Convert the image data to base64
    const imageBuffer = Buffer.from(imageArrayBuffer);
    const base64Image = imageBuffer.toString("base64");

    return NextResponse.json({
      success: true,
      data: {
        image: `data:image/png;base64,${base64Image}`,
        description: prompt,
      },
    });
  } catch (error) {
    console.error("Failed to generate memory palace:", error);
    Sentry.captureException(error);

    return NextResponse.json(
      { success: false, error: "Failed to generate memory palace" },
      { status: 500 },
    );
  }
}
