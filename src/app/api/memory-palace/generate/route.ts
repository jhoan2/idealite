import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { GoogleGenAI } from "@google/genai";
import { currentUser } from "@clerk/nextjs/server";

// Initialize Google Gen AI client
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || "";
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Use the specific model for image generation
const MODEL_ID = "gemini-2.0-flash-exp-image-generation";

export async function POST(req: Request) {
  try {
    // Authenticate user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get prompt from request body
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 },
      );
    }

    // Enhance the prompt to produce better results
    const enhancedPrompt = `Generate a detailed, high-quality image: ${prompt}. 
    The image should be clear, visually distinctive, and memorable.`;

    try {
      // Request image generation from Gemini
      const response = await genAI.models.generateContent({
        model: MODEL_ID,
        contents: enhancedPrompt,
        config: {
          responseModalities: ["Text", "Image"],
        },
      });

      let imageBase64 = null;
      let responseMimeType = "image/png";
      let textResponse = null;

      // Process each part of the response
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.text) {
          textResponse = part.text;
        } else if (part.inlineData) {
          imageBase64 = part.inlineData.data;
          responseMimeType = part.inlineData.mimeType || "image/png";
        }
      }

      if (!imageBase64) {
        throw new Error("No image was generated by Gemini");
      }

      // Return the generated image and description
      return NextResponse.json({
        success: true,
        data: {
          image: `data:${responseMimeType};base64,${imageBase64}`,
          description: prompt,
          additionalInfo: textResponse,
        },
      });
    } catch (error) {
      console.error("Gemini API error:", error);
      Sentry.captureException(error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate image",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Failed to generate memory palace:", error);
    Sentry.captureException(error);

    return NextResponse.json(
      { success: false, error: "Failed to generate memory palace" },
      { status: 500 },
    );
  }
}
