import { tryCatch } from "~/lib/tryCatch";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as Sentry from "@sentry/nextjs";
import { currentUser } from "@clerk/nextjs/server";

// Initialize Google Gen AI client
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Use the same model as in your existing code
const MODEL_ID = "gemini-2.0-flash-exp";

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
  const imageDataResult = await tryCatch(
    Promise.resolve(extractFromDataUrl(imageDataUrl)),
  );

  if (imageDataResult.error || !imageDataResult.data) {
    throw new Error("Invalid image data URL");
  }

  const imageData = imageDataResult.data;

  // Get the model with the correct configuration
  const model = genAI.getGenerativeModel({
    model: MODEL_ID,
    generationConfig: {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      // @ts-expect-error - Gemini API JS is missing this type
      responseModalities: ["Text", "Image"],
    },
  });

  // Construct a clear prompt that emphasizes preserving the overall image composition
  const instructionPrompt = `Edit this image according to these instructions: ${editInstructions}. 
  Make the edit as natural and seamless as possible while preserving the overall composition 
  and style of the original image where appropriate.`;

  // Prepare the message parts
  const messageParts = [
    { text: instructionPrompt },
    {
      inlineData: {
        data: imageData.base64,
        mimeType: imageData.mimeType,
      },
    },
  ];

  // Start a new chat
  const chat = model.startChat();

  // Send the message
  const resultResponse = await tryCatch(chat.sendMessage(messageParts as any));
  if (resultResponse.error) {
    throw new Error(`Gemini API error: ${resultResponse.error.message}`);
  }

  const result = resultResponse.data;

  // Process the response
  let textResponse = null;
  let imageData64 = null;
  let responseMimeType = "image/png";

  if (result.response?.candidates && result.response.candidates.length > 0) {
    const parts = result.response.candidates[0]?.content?.parts;

    for (const part of parts || []) {
      if ("inlineData" in part && part.inlineData) {
        // Get the image data
        imageData64 = part.inlineData.data;
        responseMimeType = part.inlineData.mimeType || "image/png";
      } else if ("text" in part && part.text) {
        // Get the text
        textResponse = part.text;
      }
    }
  }

  // Return the edited image and description
  return NextResponse.json({
    success: true,
    message: "Image edited successfully with Gemini 2.0",
    image: imageData64
      ? `data:${responseMimeType};base64,${imageData64}`
      : null,
    description: textResponse,
  });
}

/**
 * Helper function to extract base64 and mimeType from data URL
 */
function extractFromDataUrl(dataUrl: string) {
  if (!dataUrl.startsWith("data:")) {
    return null;
  }

  const parts = dataUrl.split(",");
  if (parts.length !== 2) {
    return null;
  }

  if (!parts[0]) {
    return null;
  }

  const mimeMatch = parts[0].match(/data:(.*?);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  return {
    base64: parts[1],
    mimeType,
  };
}
