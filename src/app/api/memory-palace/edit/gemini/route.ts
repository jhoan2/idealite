import { tryCatch } from "~/lib/tryCatch";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import * as Sentry from "@sentry/nextjs";
import { currentUser } from "@clerk/nextjs/server";

// Initialize Google Gen AI client
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || "";
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Use the model for image editing
const MODEL_ID = "gemini-2.5-flash-image";

export async function POST(req: NextRequest) {
  // Authenticate user
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if the request is multipart/form-data
    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      // Handle form data
      const formData = await req.formData();
      const image = formData.get("image") as File | null;
      const prompt = formData.get("prompt") as string | null;

      if (!image || !prompt) {
        return NextResponse.json(
          { error: "Image and prompt are required" },
          { status: 400 },
        );
      }

      // Convert image to base64
      const imageBytes = await image.arrayBuffer();
      const base64Image = Buffer.from(imageBytes).toString("base64");
      const mimeType = image.type || "image/jpeg";
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      // Process with Gemini API using tryCatch
      const result = await tryCatch(processImageEdit(dataUrl, prompt));

      if (result.error) {
        Sentry.captureException(result.error);
        return NextResponse.json(
          { error: "Failed to edit image", details: result.error.message },
          { status: 500 },
        );
      }

      return result.data;
    } else {
      // Handle JSON request (for cases where image is already a data URL)
      const requestData = await req.json();
      const { image, prompt } = requestData;

      if (!image || !prompt) {
        return NextResponse.json(
          { error: "Image and prompt are required" },
          { status: 400 },
        );
      }

      // Process with Gemini API using tryCatch
      const result = await tryCatch(processImageEdit(image, prompt));

      if (result.error) {
        Sentry.captureException(result.error);
        return NextResponse.json(
          { error: "Failed to edit image", details: result.error.message },
          { status: 500 },
        );
      }

      return result.data;
    }
  } catch (error) {
    console.error("Error processing image edit:", error);
    Sentry.captureException(error);
    return NextResponse.json(
      {
        error: "Failed to edit image",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * Process image edit operation using Gemini
 *
 * @param imageDataUrl - Base64 data URL of the image
 * @param editInstructions - Free-form instructions on how to edit the image
 */
async function processImageEdit(
  imageDataUrl: string,
  editInstructions: string,
) {
  // Extract base64 and mime type from the data URL
  const imageData = extractFromDataUrl(imageDataUrl);
  if (!imageData) {
    throw new Error("Invalid image data URL");
  }

  try {
    // Construct a clear prompt that emphasizes preserving the overall image composition
    const instructionPrompt = `Edit this image according to these instructions: ${editInstructions}. 
    Make the edit as natural and seamless as possible while preserving the overall composition 
    and style of the original image where appropriate.`;

    // Prepare the content for the API request
    const contents = [
      { text: instructionPrompt },
      {
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64,
        },
      },
    ];

    // Generate content with the new SDK
    const response = await genAI.models.generateContent({
      model: MODEL_ID,
      contents: contents,
      config: {
        responseModalities: ["Text", "Image"],
      },
    });

    // Process the response
    let textResponse = null;
    let imageData64 = null;
    let responseMimeType = "image/png";

    // Extract image and text from the response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.text) {
        textResponse = part.text;
      } else if (part.inlineData) {
        imageData64 = part.inlineData.data;
        responseMimeType = part.inlineData.mimeType || "image/png";
      }
    }

    if (!imageData64) {
      throw new Error("No image was returned by Gemini");
    }

    // Return the edited image and description
    return NextResponse.json({
      success: true,
      message: "Image edited successfully with Gemini 2.5 Flash Image",
      image: `data:${responseMimeType};base64,${imageData64}`,
      description: textResponse,
    });
  } catch (error) {
    console.error("Error in Gemini image edit:", error);
    throw new Error(
      `Failed to edit image: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Helper function to extract base64 and mimeType from data URL
 */
function extractFromDataUrl(dataUrl: string) {
  if (!dataUrl.startsWith("data:")) {
    return null;
  }

  const parts = dataUrl.split(",");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  const mimeMatch = parts[0].match(/data:(.*?);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  return {
    base64: parts[1],
    mimeType,
  };
}
