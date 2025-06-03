import { db } from "~/server/db";
import { tags, users_tags } from "~/server/db/schema";
import { eq, and, gt, sql, desc, cosineDistance } from "drizzle-orm";
import { generateEmbedding } from "./generateEmbedding";
import * as Sentry from "@sentry/nextjs";

/**
 * Extracts the first few paragraphs from HTML content
 */
function extractFirstParagraphs(
  htmlContent: string,
  paragraphCount = 3,
): string {
  // Simple extraction of text from HTML for embedding purposes
  const textContent = htmlContent.replace(/<[^>]*>/g, " ").trim();

  // Split by double newlines to get paragraphs
  const paragraphs = textContent.split(/\n\s*\n/);

  // Take the first N paragraphs or all if there are fewer
  return paragraphs.slice(0, paragraphCount).join("\n\n");
}

/**
 * Determines the best tag for page content using semantic similarity
 * Uses database-level vector operations for better performance
 *
 * @param content The HTML content of the page
 * @param userId The user ID to find relevant tags
 * @param fallbackTagId The fallback tag ID if no matching tag is found
 * @param similarityThreshold The minimum similarity score to use a tag (0-1)
 * @returns The ID of the best matching tag or the fallback tag
 */
export async function determinePageTag(
  content: string,
  userId: string,
  fallbackTagId: string,
  similarityThreshold = 0.7,
): Promise<string> {
  try {
    // Extract text for embedding
    const textForEmbedding = extractFirstParagraphs(content);

    // If there's not enough text, return fallback
    if (textForEmbedding.length < 20) {
      return fallbackTagId;
    }

    // Generate embedding for the content
    const contentEmbedding = await generateEmbedding(textForEmbedding);

    // Calculate similarity directly in the database
    // 1 - cosineDistance = cosineSimilarity
    const similarity = sql<number>`1 - (${cosineDistance(tags.embedding, contentEmbedding)})`;

    // Query for the most similar tags the user has access to
    const similarTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        similarity,
      })
      .from(tags)
      .innerJoin(users_tags, eq(users_tags.tag_id, tags.id))
      .where(
        and(
          eq(users_tags.user_id, userId),
          eq(tags.deleted, false),
          gt(similarity, similarityThreshold),
        ),
      )
      .orderBy(desc(similarity))
      .limit(1);

    // Return the most similar tag if found, otherwise use fallback
    const bestMatch = similarTags[0];
    return bestMatch?.id ?? fallbackTagId;
  } catch (error) {
    console.error("Error determining page tag:", error);

    Sentry.captureException(error, {
      extra: {
        userId,
        contentLength: content?.length,
        operation: "determinePageTag",
      },
      tags: {
        feature: "auto_tagging",
        source: "database_vector_search",
      },
    });

    return fallbackTagId; // Fallback to root tag on error
  }
}

/**
 * Analyze and return tag similarity scores for debugging/testing
 * This helps with tuning the similarity threshold
 */
export async function analyzeTagSimilarity(
  content: string,
  userId: string,
  limit = 5,
) {
  try {
    // Extract text for embedding
    const textForEmbedding = extractFirstParagraphs(content);

    // Generate embedding for the content
    const contentEmbedding = await generateEmbedding(textForEmbedding);

    // Calculate similarity directly in the database
    const similarity = sql<number>`1 - (${sql.raw(`${tags.embedding.name} <=> ${"[" + contentEmbedding.join(",") + "]"}`)})`;

    // Get top similar tags with their scores
    const similarTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        similarity,
      })
      .from(tags)
      .innerJoin(users_tags, eq(users_tags.tag_id, tags.id))
      .where(and(eq(users_tags.user_id, userId), eq(tags.deleted, false)))
      .orderBy(desc(similarity))
      .limit(limit);

    return {
      success: true,
      content: textForEmbedding.substring(0, 100) + "...",
      matches: similarTags,
    };
  } catch (error) {
    console.error("Error analyzing tag similarity:", error);

    Sentry.captureException(error, {
      extra: {
        userId,
        contentLength: content?.length,
        operation: "analyzeTagSimilarity",
      },
      tags: {
        feature: "auto_tagging",
        source: "similarity_analysis",
      },
    });

    return {
      success: false,
      error: "Failed to analyze tag similarity",
    };
  }
}
