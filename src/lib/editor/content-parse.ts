// src/lib/editor/content-parser.ts
// Utility functions for extracting metadata from TipTap HTML content

/**
 * Extracts a clean text description from HTML content
 * Strips HTML tags, normalizes whitespace, and truncates to reasonable length
 */
export function extractDescription(htmlContent: string): string | null {
  if (!htmlContent?.trim()) {
    return null;
  }

  // Remove HTML tags but preserve some structure
  let textContent = htmlContent
    // Replace block elements with line breaks to preserve structure
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    // Remove all remaining HTML tags
    .replace(/<[^>]*>/g, " ")
    // Decode HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean up whitespace
  textContent = textContent
    // Replace multiple whitespace characters with single spaces
    .replace(/\s+/g, " ")
    // Replace multiple line breaks with double line breaks
    .replace(/\n\s*\n\s*/g, "\n\n")
    // Trim leading/trailing whitespace
    .trim();

  // Return null if we ended up with empty content
  if (!textContent) {
    return null;
  }

  // Truncate to reasonable length (aim for ~200-300 chars for good UX)
  const maxLength = 280;
  if (textContent.length <= maxLength) {
    return textContent;
  }

  // Find a good break point (end of sentence or word)
  const truncated = textContent.slice(0, maxLength);

  // Try to break at end of sentence
  const lastSentence = truncated.lastIndexOf(". ");
  if (lastSentence > maxLength * 0.7) {
    return truncated.slice(0, lastSentence + 1).trim();
  }

  // Fall back to breaking at last word
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace).trim() + "...";
  }

  // If all else fails, hard truncate
  return truncated.trim() + "...";
}

/**
 * Extracts up to 3 image URLs from HTML content
 * Prioritizes images that appear earlier in the document
 */
export function extractImagePreviews(htmlContent: string): string[] {
  if (!htmlContent?.trim()) {
    return [];
  }

  // Find all image tags and extract src attributes
  const imgMatches = [
    ...htmlContent.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi),
  ];

  const imageUrls = imgMatches
    .map((match) => match[1])
    .filter((url): url is string => Boolean(url)) // Type-safe filter for non-null URLs
    .filter((url) => {
      // Basic URL validation
      try {
        // Check if it's a valid URL format
        const urlObj = new URL(url, "http://example.com"); // Use base URL for relative URLs
        return urlObj.href !== "http://example.com/";
      } catch {
        // If URL constructor fails, check if it's a reasonable relative path
        return (
          url.startsWith("/") || url.startsWith("http") || url.includes(".")
        );
      }
    })
    .slice(0, 3); // Limit to first 3 images

  // Remove duplicates while preserving order
  return Array.from(new Set(imageUrls));
}

/**
 * Helper function to validate and clean image URLs
 */
function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  // Check for common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;
  const hasImageExtension = imageExtensions.test(url);

  // Check for data URLs (base64 images)
  const isDataUrl = url.startsWith("data:image/");

  // Check for common image hosting patterns
  const imageHostingPatterns = [
    /cloudflare/i,
    /amazonaws\.com/i,
    /cloudinary/i,
    /imgur/i,
    /unsplash/i,
    /pexels/i,
  ];
  const hasImageHosting = imageHostingPatterns.some((pattern) =>
    pattern.test(url),
  );

  return hasImageExtension || isDataUrl || hasImageHosting;
}

/**
 * Enhanced image extraction that validates URLs and filters out non-images
 */
export function extractValidImagePreviews(htmlContent: string): string[] {
  const allImages = extractImagePreviews(htmlContent);
  return allImages.filter(isValidImageUrl);
}

/**
 * Main function to extract all metadata at once
 * Useful for the background processing job
 */
export function extractPageMetadata(htmlContent: string): {
  description: string | null;
  imagePreviews: string[];
} {
  return {
    description: extractDescription(htmlContent),
    imagePreviews: extractValidImagePreviews(htmlContent),
  };
}

/**
 * Helper to check if content has changed enough to warrant re-parsing
 * Simple implementation - you could make this more sophisticated
 */
export function hasContentChangedSignificantly(
  oldContent: string,
  newContent: string,
  threshold: number = 0.1, // 10% change threshold
): boolean {
  if (!oldContent && !newContent) return false;
  if (!oldContent || !newContent) return true;

  // Simple length-based comparison
  const lengthDiff = Math.abs(oldContent.length - newContent.length);
  const maxLength = Math.max(oldContent.length, newContent.length);

  if (maxLength === 0) return false;

  return lengthDiff / maxLength > threshold;
}
