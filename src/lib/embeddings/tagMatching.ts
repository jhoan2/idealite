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
 * Returns a clean excerpt of the note for AI analysis.
 *
 * How it works ──────────────────────────────────────────
 * 1.   Strips all HTML tags.
 * 2.   Splits on blank-line boundaries (“paragraphs”).
 * 3.   Takes the first `paraCount` paragraphs **or**
 *      enough extra text to reach `minChars`, whichever is longer.
 * 4.   Collapses whitespace so the result is tidy.
 *
 * @param html       Raw HTML (or Markdown rendered to HTML).
 * @param paraCount  Number of leading paragraphs you *prefer* to send.
 * @param minChars   Minimum characters to guarantee even if the first
 *                   paragraphs are just bullet points or headings.
 * @returns          A plain-text excerpt ready for the LLM.
 */
export function excerptForLLM(
  html: string,
  paraCount = 3,
  minChars = 400,
): string {
  // 1. Strip tags quickly (good enough for plain content).
  const plain = html.replace(/<[^>]*>/g, " ");

  // 2. Split paragraphs on blank lines.
  const paras = plain.split(/\n\s*\n/);

  // 3. Take the first N paragraphs.
  let excerpt = paras.slice(0, paraCount).join("\n\n");

  // 4. If that’s still too short, append more raw text
  //    until we hit minChars (or run out of content).
  if (excerpt.length < minChars) {
    excerpt = plain.slice(0, minChars);
  }

  // 5. Collapse duplicate whitespace and trim.
  return excerpt.replace(/\s+/g, " ").trim();
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
    const textForAnalysis = excerptForLLM(content);

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
      model: "gpt-4.1",
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
      max_completion_tokens: 100, // We only need a short response
    });

    const raw = response.choices[0]?.message?.content ?? "";

    const uuid =
      (raw.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
      ) || [])[0] ?? raw.trim(); // fall back to the whole string if no UUID found

    if (!uuid) {
      return fallbackTagId;
    }

    // Check if LLM returned FALLBACK
    if (uuid.toUpperCase() === "FALLBACK") {
      return fallbackTagId;
    }

    // Validate that the returned ID exists in our tag list
    const selectedTag = userTags.find((tag) => tag.id === uuid);

    if (selectedTag) {
      return selectedTag.id;
    } else {
      // Try to find partial matches (in case LLM added extra characters)
      const partialMatch = userTags.find(
        (tag) => uuid.includes(tag.id) || tag.id.includes(uuid),
      );

      if (partialMatch) {
        return partialMatch.id;
      }

      return fallbackTagId;
    }
  } catch (error) {
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
