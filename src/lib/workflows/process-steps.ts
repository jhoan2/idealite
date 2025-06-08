// lib/workflows/process-steps.ts
import { v4 as uuidv4 } from "uuid";
import { db } from "~/server/db";
import { images } from "~/server/db/schema";
import { createPageWithRelationsFromWebhook } from "~/server/actions/page";
import { updateStorageUsedWorkflow } from "~/server/actions/storage";
import { determinePageTag } from "~/lib/embeddings/tagMatching";
import {
  downloadTextFromIPFS,
  cleanupTempFiles as cleanupIPFS,
  createAccessLinkForPrivateFile,
} from "~/lib/pinata/uploadTempFiles";
import {
  processBookResourceFromWebhook,
  processUrlResourceFromWebhook,
} from "~/server/actions/webhook-resource";
import { processMarkdownForTiptap } from "~/lib/markdown/markdownToTiptapHTML";
import { semanticHtmlSplitter } from "~/lib/flashcards/semanticHtmlSplitter";
import { cardsForChunks } from "~/lib/flashcards/generateFlashcards";
import {
  postProcess,
  saveFlashcardsWithPageTags,
} from "~/lib/flashcards/processFlashcards";
import * as Sentry from "@sentry/nextjs";

const ROOT_TAG_ID = process.env.ROOT_TAG_ID || "default-tag-id";

interface ImgRef {
  nodeId: string;
  filename: string;
  cid?: string;
}

interface WorkflowInput {
  userId: string;
  fileName: string;
  fileSize: number;
  markdownCid: string;
  markdownAccessUrl: string;
  markdownAccessExpires: string;
  imageData: Array<{
    cid: string;
    name: string;
    size: number;
    isTemp: false;
    publicUrl: string;
  }>;
  frontMatter?: Record<string, any> | null;
}

async function getValidAccessUrl(
  cid: string,
  existingUrl?: string,
  expiresAt?: string,
): Promise<string> {
  if (existingUrl && expiresAt) {
    const expiry = new Date(expiresAt);
    const now = new Date();
    if (expiry.getTime() - now.getTime() > 5 * 60 * 1000) {
      return existingUrl;
    }
  }

  try {
    return await createAccessLinkForPrivateFile(cid, 1800);
  } catch (error) {
    throw new Error(
      `Cannot access file with CID ${cid}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// STEP 1: Download files and convert markdown
export async function downloadAndProcessFiles(input: WorkflowInput) {
  try {
    const markdownExpiry = new Date(input.markdownAccessExpires);
    const now = new Date();

    if (markdownExpiry <= now) {
      throw new Error(
        `Markdown file access expired at ${markdownExpiry}. File: ${input.fileName}`,
      );
    }

    let markdownContent: string;
    try {
      const markdownAccessUrl = await getValidAccessUrl(
        input.markdownCid,
        input.markdownAccessUrl,
        input.markdownAccessExpires,
      );

      markdownContent = await downloadTextFromIPFS(
        input.markdownCid,
        markdownAccessUrl,
      );

      // Pre-process: Convert Obsidian wiki-link images to standard markdown
      let processedMarkdown = markdownContent;

      // Convert ![[filename]] to ![filename](filename) with URL encoding
      const wikiImageRegex = /!\[\[([^\]]+)\]\]/g;
      const wikiMatches = [...markdownContent.matchAll(wikiImageRegex)];

      wikiMatches.forEach((match) => {
        const fullMatch = match[0];
        const filename = match[1];
        const encodedFilename = encodeURIComponent(filename || "");
        const standardMarkdown = `![${filename}](${encodedFilename})`;
        processedMarkdown = processedMarkdown.replace(
          fullMatch,
          standardMarkdown,
        );
      });

      // Fix existing standard markdown images with spaces
      const existingImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      const existingMatches = [
        ...processedMarkdown.matchAll(existingImageRegex),
      ];

      existingMatches.forEach((match) => {
        const fullMatch = match[0];
        const alt = match[1] || "";
        const src = match[2] || "";

        if (src && src.includes(" ") && !src.includes("%20")) {
          const encodedSrc = encodeURIComponent(src);
          const fixedMarkdown = `![${alt}](${encodedSrc})`;
          processedMarkdown = processedMarkdown.replace(
            fullMatch,
            fixedMarkdown,
          );
        }
      });

      // Normalize indentation to prevent code block creation
      const lines = processedMarkdown.split("\n");
      const normalizedLines = lines.map((line) => {
        if (line.includes("![") && line.includes("](")) {
          const leadingWhitespaceMatch = line.match(/^[ \t]*/);
          const leadingWhitespace = leadingWhitespaceMatch
            ? leadingWhitespaceMatch[0]
            : "";
          const leadingSpaces = leadingWhitespace.replace(/\t/g, "    ").length;

          if (leadingSpaces >= 4) {
            const content = line.trimStart();
            const newIndent = " ".repeat(3);
            return newIndent + content;
          }
        }
        return line;
      });

      markdownContent = normalizedLines.join("\n");

      // Process images
      const imageContents: {
        name: string;
        cid: string;
        size: number;
        publicUrl: string;
      }[] = [];

      if (input.imageData && input.imageData.length > 0) {
        for (const imageInfo of input.imageData) {
          imageContents.push({
            name: imageInfo.name,
            cid: imageInfo.cid,
            size: imageInfo.size,
            publicUrl: imageInfo.publicUrl,
          });
        }
      }

      const { html, frontmatter } =
        await processMarkdownForTiptap(markdownContent);

      // Extract image references from HTML
      const imgRefs: ImgRef[] = [];
      const imgMatches = html.matchAll(
        /<img[^>]+src=["']([^"']+)["'][^>]*data-node-id=["']([^"']+)["'][^>]*>/g,
      );

      for (const match of imgMatches) {
        const filename = match[1];
        const nodeId = match[2];
        if (filename && nodeId) {
          imgRefs.push({ filename, nodeId });
        }
      }

      return { html, imageContents, imgRefs, frontmatter };
    } catch (error) {
      throw new Error(
        `Failed to download markdown file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  } catch (error) {
    throw error;
  }
}

// STEP 2: Create page and handle images
export async function createPageFromContent(
  input: WorkflowInput,
  html: string,
  imageContents: any[],
  imgRefs: ImgRef[],
) {
  let finalHtml = html;
  let imagesProcessed = 0;

  // Process images
  if (imageContents.length > 0) {
    for (const imageContent of imageContents) {
      const ref = imgRefs.find((r) => {
        const decodedRefFilename = decodeURIComponent(r.filename);
        return (
          r.filename === imageContent.name ||
          decodedRefFilename === imageContent.name
        );
      });

      if (!ref) {
        continue;
      }

      // Create database record for the image
      await db.insert(images).values({
        id: uuidv4(),
        user_id: input.userId,
        filename: imageContent.name,
        url: imageContent.cid,
        size: imageContent.size,
        is_temporary: false,
      });

      // Update storage quota
      await updateStorageUsedWorkflow(input.userId, imageContent.size);

      // Update image reference with the public URL
      ref.cid = imageContent.cid;
      imagesProcessed++;
    }

    // Update image references in HTML to use public URLs
    for (const { filename, cid } of imgRefs) {
      if (!cid) {
        continue;
      }

      const decodedFilename = decodeURIComponent(filename);
      const imageContent = imageContents.find(
        (img) => img.name === filename || img.name === decodedFilename,
      );

      if (imageContent?.publicUrl) {
        const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(
          `(<img[^>]+src=["'])${escapedFilename}(["'][^>]*>)`,
          "g",
        );
        finalHtml = finalHtml.replace(regex, `$1${imageContent.publicUrl}$2`);
      }
    }
  }

  // Create page with auto-tagging
  const primaryTagId = await determinePageTag(
    finalHtml,
    input.userId,
    ROOT_TAG_ID,
    0.8,
  ).catch((err) => {
    Sentry.captureException(err, {
      tags: {
        action: "determinePageTag",
        fileName: input.fileName,
      },
      extra: { input },
    });
    return ROOT_TAG_ID;
  });

  const pageResult = await createPageWithRelationsFromWebhook({
    title: input.fileName.replace(/\.[^/.]+$/, ""),
    content: finalHtml,
    content_type: "page",
    user_id: input.userId,
    primary_tag_id: primaryTagId,
  });

  if (!pageResult.success) {
    Sentry.captureException(new Error("Failed to create page"), {
      tags: {
        action: "createPageWithRelationsFromWebhook",
        fileName: input.fileName,
      },
      extra: { input },
    });
    throw new Error("Failed to create page");
  }

  const page = pageResult as { success: true; page: { id: string } };
  return { pageId: page.page.id, imagesProcessed, finalHtml };
}

// STEP 3: Generate flashcards from the page content
export async function generateFlashcards(
  userId: string,
  pageId: string,
  htmlContent: string,
) {
  try {
    const chunks = semanticHtmlSplitter(htmlContent);

    if (chunks.length === 0) {
      return { chunks: 0, validCards: 0 };
    }

    const rawCards = await cardsForChunks(chunks, pageId);
    const validatedCards = postProcess(rawCards);

    if (validatedCards.length > 0) {
      const result = await saveFlashcardsWithPageTags(
        validatedCards,
        userId,
        pageId,
      );

      return {
        chunks: chunks.length,
        validCards: result.saved,
        failed: result.failed || 0,
      };
    }

    return {
      chunks: chunks.length,
      validCards: 0,
      failed: 0,
    };
  } catch (error) {
    return {
      chunks: 0,
      validCards: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// STEP 4: Process resources from frontmatter
export async function processResources(
  frontMatter: Record<string, any>,
  userId: string,
  pageId: string,
) {
  let resourcesCreated = 0;
  const errors: string[] = [];

  // Process books
  if (frontMatter.books) {
    const books = Array.isArray(frontMatter.books)
      ? frontMatter.books
      : [frontMatter.books];

    for (const [index, raw] of books.entries()) {
      try {
        const title =
          typeof raw === "string" ? raw : raw.title || raw.name || "";
        const author =
          typeof raw === "object" ? raw.author || raw.authors || "" : "";

        if (!title) {
          continue;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(
          `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`,
          {
            signal: controller.signal,
            headers: { "User-Agent": "Idealite-App/1.0" },
          },
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `OpenLibrary API returned ${response.status}: ${response.statusText}`,
          );
        }

        const data = await response.json();

        if (data.docs && data.docs.length > 0) {
          const book = data.docs[0];
          const resource = await processBookResourceFromWebhook(
            {
              title: book.title,
              author: book.author_name?.join(", ") || author,
              open_library_id: book.key,
              url: `https://openlibrary.org${book.key}`,
              description: book.first_sentence?.[0] || "",
              image: book.cover_i
                ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                : "",
              date_published: book.first_publish_year
                ? new Date(book.first_publish_year, 0, 1)
                : undefined,
            },
            userId,
            pageId,
          );
          if (resource) resourcesCreated++;
        }
      } catch (error) {
        const errorMsg = `Failed to process book ${index + 1}: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMsg);

        Sentry.captureException(error, {
          tags: {
            action: "processBook",
            severity: "warning",
          },
          extra: { book: raw, index },
        });
      }
    }
  }

  // Process URLs
  if (frontMatter.urls) {
    const urls = Array.isArray(frontMatter.urls)
      ? frontMatter.urls
      : [frontMatter.urls];
    const origin =
      process.env.NEXT_PUBLIC_DEPLOYMENT_URL || "http://localhost:3000";

    for (const [index, url] of urls.entries()) {
      try {
        const urlStr = url.trim();
        const isTwitter = ["twitter.com", "x.com"].some((domain) =>
          urlStr.includes(domain),
        );

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const metaRes = await fetch(
          isTwitter
            ? `${origin}/api/twitter?url=${encodeURIComponent(urlStr)}`
            : `${origin}/api/resource?type=url&query=${encodeURIComponent(urlStr)}`,
          { signal: controller.signal },
        );

        clearTimeout(timeoutId);

        if (!metaRes.ok) {
          throw new Error(
            `Metadata API returned ${metaRes.status}: ${metaRes.statusText}`,
          );
        }

        const meta = await metaRes.json();

        const resource = await processUrlResourceFromWebhook(
          urlStr,
          userId,
          pageId,
          {
            title: meta.title || urlStr,
            description: meta.description || "",
            author: meta.author || undefined,
            image: meta.image || undefined,
            og_type: meta.og_type || undefined,
            date_published: meta.date_published
              ? new Date(meta.date_published)
              : undefined,
          },
        );

        if (resource) resourcesCreated++;
      } catch (error) {
        const errorMsg = `Failed to process URL ${index + 1}: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMsg);

        Sentry.captureException(error, {
          tags: {
            action: "processUrl",
            severity: "warning",
          },
          extra: { url, index },
        });
      }
    }
  }

  return resourcesCreated;
}

// STEP 5: Cleanup
export async function cleanupTempFiles(input: WorkflowInput) {
  const tempCids = [input.markdownCid];
  await cleanupIPFS(tempCids);
}
