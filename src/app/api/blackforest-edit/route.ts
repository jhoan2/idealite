import "server-only";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { image, mask, prompt } = await request.json();
    if (!image || !mask) {
      return NextResponse.json(
        { error: "Image and mask are required" },
        { status: 400 },
      );
    }

    const response = await fetch("https://api.bfl.ml/v1/flux-pro-1.0-fill", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Key": process.env.BLACK_FOREST_API_KEY!,
      },
      body: JSON.stringify({
        image: image || "",
        mask: mask || "",
        prompt: prompt || "",
        steps: 50,
        prompt_upsampling: false,
        guidance: 60,
        output_format: "jpeg",
        safety_tolerance: 2,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.log("API Error:", error);
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("API Response:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in blackforest-edit:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 },
    );
  }
}
