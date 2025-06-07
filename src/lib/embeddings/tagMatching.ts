import { db } from "~/server/db";
import { tags, users_tags } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import OpenAI from "openai";
import * as Sentry from "@sentry/nextjs";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extracts the first few paragraphs from HTML content
 */
function extractFirstParagraphs(
  htmlContent: string,
  paragraphCount = 3,
): string {
  // Simple extraction of text from HTML for LLM analysis
  const textContent = htmlContent.replace(/<[^>]*>/g, " ").trim();

  // Split by double newlines to get paragraphs
  const paragraphs = textContent.split(/\n\s*\n/);

  // Take the first N paragraphs or all if there are fewer
  return paragraphs.slice(0, paragraphCount).join("\n\n");
}

/**
 * Determines the best tag for page content using LLM reasoning
 *
 * @param content The HTML content of the page
 * @param userId The user ID to find relevant tags
 * @param fallbackTagId The fallback tag ID if no matching tag is found
 * @param similarityThreshold Unused in LLM version, kept for compatibility
 * @returns The ID of the best matching tag or the fallback tag
 */
export async function determinePageTag(
  content: string,
  userId: string,
  fallbackTagId: string,
  similarityThreshold = 0.7, // Unused but kept for compatibility
): Promise<string> {
  try {
    // Extract text for LLM analysis
    const textForAnalysis = extractFirstParagraphs(content);

    // If there's not enough text, return fallback
    if (textForAnalysis.length < 20) {
      return fallbackTagId;
    }

    // Get all tags the user has access to
    const userTags = await db
      .select({
        id: tags.id,
        name: tags.name,
      })
      .from(tags)
      .innerJoin(users_tags, eq(users_tags.tag_id, tags.id))
      .where(
        and(
          eq(users_tags.user_id, userId),
          eq(tags.deleted, false),
          eq(users_tags.is_archived, false),
        ),
      );

    // If user has no tags, return fallback
    if (userTags.length === 0) {
      return fallbackTagId;
    }

    // Prepare tag list for the LLM
    const tagList = userTags
      .map((tag, index) => `${index + 1}. ${tag.name} (ID: ${tag.id})`)
      .join("\n");

    // Create the prompt for the LLM
    const prompt = `You are an academic content categorization specialist. Your task is to analyze the following content using academic categorization principles and determine which tag from the provided list best categorizes this content.

CONTENT TO ANALYZE:
${textForAnalysis}

AVAILABLE TAGS:
${tagList}

ACADEMIC CATEGORIZATION INSTRUCTIONS:
1. Carefully read and understand the content's main subject matter, methodology, and scope
2. Consider the content's disciplinary context - what academic field or domain does it belong to?
3. Identify the primary knowledge area, theoretical framework, or research domain
4. Look for key concepts, terminology, and approaches that signal specific academic categories
5. Apply hierarchical thinking - consider both broad disciplines and specific sub-fields
6. Choose the tag that most precisely represents the content's academic classification
7. If the content spans multiple disciplines, prioritize the most prominent or central theme
8. If none of the available tags adequately represent the academic category, respond with "FALLBACK"

REASONING APPROACH:
- What is the primary academic discipline or field of study?
- What are the key concepts, theories, or methodologies discussed?
- Which tag best captures the scholarly domain this content belongs to?
- Is this theoretical, applied, empirical, or conceptual work?

Your response should be a single line containing either:
- The tag ID (UUID format) that best represents the academic categorization
- The word "FALLBACK" if no suitable academic category exists

Tag ID:`;

    // Call the LLM
    const response = await openai.chat.completions.create({
      model: "o4-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert academic librarian and content categorization specialist. Your expertise lies in scholarly classification systems and academic taxonomies. Always respond with only the requested tag ID or 'FALLBACK' based on rigorous academic categorization principles.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistent results
      max_tokens: 100, // We only need a short response
    });

    const llmResponse = response.choices[0]?.message?.content?.trim();

    if (!llmResponse) {
      console.warn("No response from LLM for tag determination");
      return fallbackTagId;
    }

    // Check if LLM returned FALLBACK
    if (llmResponse.toUpperCase() === "FALLBACK") {
      return fallbackTagId;
    }

    // Validate that the returned ID exists in our tag list
    const selectedTag = userTags.find((tag) => tag.id === llmResponse);

    if (selectedTag) {
      return selectedTag.id;
    } else {
      console.warn("LLM returned invalid tag ID:", llmResponse);

      // Try to find partial matches (in case LLM added extra characters)
      const partialMatch = userTags.find(
        (tag) => llmResponse.includes(tag.id) || tag.id.includes(llmResponse),
      );

      if (partialMatch) {
        return partialMatch.id;
      }

      return fallbackTagId;
    }
  } catch (error) {
    console.error("Error determining page tag with LLM:", error);

    Sentry.captureException(error, {
      extra: {
        userId,
        contentLength: content?.length,
        operation: "determinePageTag_Academic_LLM",
      },
      tags: {
        feature: "academic_llm_tagging",
        source: "academic_llm_reasoning",
      },
    });

    return fallbackTagId; // Fallback to root tag on error
  }
}

/**
 * Analyze and return tag selection reasoning for debugging/testing
 * This helps with understanding how the LLM makes decisions
 */
export async function analyzeTagSelection(
  content: string,
  userId: string,
  limit = 5,
) {
  try {
    // Extract text for LLM analysis
    const textForAnalysis = extractFirstParagraphs(content);

    // Get user tags
    const userTags = await db
      .select({
        id: tags.id,
        name: tags.name,
      })
      .from(tags)
      .innerJoin(users_tags, eq(users_tags.tag_id, tags.id))
      .where(
        and(
          eq(users_tags.user_id, userId),
          eq(tags.deleted, false),
          eq(users_tags.is_archived, false),
        ),
      )
      .limit(limit);

    const tagList = userTags.map((tag) => `- ${tag.name}`).join("\n");

    // Create analysis prompt
    const prompt = `As an academic content categorization specialist, analyze this content and explain your reasoning for academic tag selection:

CONTENT:
${textForAnalysis}

AVAILABLE TAGS:
${tagList}

Please provide a detailed academic analysis:
1. Identify the primary academic discipline(s) and sub-fields represented
2. Analyze the key concepts, methodologies, and theoretical frameworks present
3. Determine the scholarly domain and research context
4. Explain which tag best represents the academic categorization and why
5. Rate your confidence in this academic classification (1-10)
6. Suggest any missing academic categories that would provide better classification
7. Consider interdisciplinary aspects and cross-field connections

Academic Analysis:`;

    console.log("🔬 [TAG_ANALYSIS] Sending analysis prompt to LLM...");

    const response = await openai.chat.completions.create({
      model: "o4-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert academic librarian and content analysis specialist. Provide detailed scholarly reasoning for content categorization decisions using academic classification principles.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    console.log("🔬 [TAG_ANALYSIS] Analysis complete");

    return {
      success: true,
      content: textForAnalysis.substring(0, 100) + "...",
      analysis: response.choices[0]?.message?.content,
      availableTags: userTags,
    };
  } catch (error) {
    console.error(
      "🔬 [ACADEMIC_TAG_ANALYSIS] Error analyzing academic tag selection:",
      error,
    );

    Sentry.captureException(error, {
      extra: {
        userId,
        contentLength: content?.length,
        operation: "analyzeTagSelection_Academic_LLM",
      },
      tags: {
        feature: "academic_llm_tagging",
        source: "academic_tag_analysis",
      },
    });

    return {
      success: false,
      error: "Failed to analyze tag selection",
    };
  }
}
