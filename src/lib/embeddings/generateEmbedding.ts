import OpenAI from "openai";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// The model used for embeddings - text-embedding-ada-002 outputs 1536-dimensional vectors
const EMBEDDING_MODEL = "text-embedding-ada-002";

/**
 * Generate an embedding vector for a text string using OpenAI's embeddings API
 *
 * @param text The text to generate an embedding for
 * @returns A 1536-dimensional vector representing the text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });

    return response.data[0]?.embedding ?? [];
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding");
  }
}

/**
 * Generate an embedding specifically for a tag
 * This could be extended to include additional context or processing specific to tags
 *
 * @param tagName The name of the tag
 * @returns A 1536-dimensional vector for the tag
 */
export async function generateTagEmbedding(tagName: string): Promise<number[]> {
  return generateEmbedding(tagName);
}
