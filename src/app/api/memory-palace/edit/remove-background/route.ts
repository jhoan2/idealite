import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import axios from "axios";
import FormData from "form-data";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const webFormData = await req.formData();
    const imageFile = webFormData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: "Missing required field: image" },
        { status: 400 },
      );
    }

    const imageArrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);

    // Build form-data matching the official Stability AI example
    const payload = new FormData();
    payload.append("image", imageBuffer, {
      filename: imageFile.name || "image.png",
      contentType: imageFile.type || "image/png",
    });
    payload.append("output_format", "png");

    const response = await axios.post(
      "https://api.stability.ai/v2beta/stable-image/edit/remove-background",
      payload,
      {
        validateStatus: undefined,
        responseType: "arraybuffer",
        headers: {
          ...payload.getHeaders(),
          Authorization: `Bearer ${process.env.STABLE_DIFFUSION_API_KEY}`,
          Accept: "image/*",
        },
      },
    );

    if (response.status !== 200) {
      const errorText = Buffer.from(response.data).toString();
      console.error("Stability AI API error:", response.status, errorText);
      return NextResponse.json(
        { success: false, error: "Failed to remove background" },
        { status: response.status },
      );
    }

    const base64Image = Buffer.from(response.data).toString("base64");

    return NextResponse.json({
      success: true,
      message: "Background removed successfully",
      image: `data:image/png;base64,${base64Image}`,
    });
  } catch (error) {
    console.error("Error in remove background:", error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Failed to process remove background operation" },
      { status: 500 },
    );
  }
}
