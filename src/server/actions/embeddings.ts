// src/server/actions/embeddings.ts
"use server";

import { db } from "~/server/db";
import {
  page_chunks,
  pages,
  users_pages,
  pages_edges,
} from "~/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { VoyageContextualEmbeddings } from "~/lib/embeddings/voyage-client";
import { sql } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import {
  updatePageNodeHashes,
  hasSignificantNodeChanges,
  type NodeChange,
} from "./node-hashes";
import {
  NodeAwareChunker,
  type ChunkWithNodeIds,
} from "~/lib/embeddings/node-aware-chunker";

// Simple wrapper that uses the context-aware version with force=true
export async function generatePageEmbeddings(pageId: string): Promise<{
  success: boolean;
  chunksCreated?: number;
  error?: string;
}> {
  try {
    const user = await currentUser();
    if (!user?.externalId) {
      throw new Error("Unauthorized");
    }

    const result = await generatePageEmbeddingsWithContext(
      pageId,
      user.externalId,
      true, // Force regenerate for backward compatibility
    );

    return {
      success: result.success,
      chunksCreated: result.chunksCreated,
      error: result.error,
    };
  } catch (error) {
    console.error("Error generating page embeddings:", error);
    Sentry.captureException(error, {
      tags: { operation: "generate_page_embeddings_wrapper" },
      extra: { pageId },
    });

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate embeddings",
    };
  }
}

// Main embedding generation function with incremental support
export async function generatePageEmbeddingsWithContext(
  pageId: string,
  userId: string,
  forceRegenerate: boolean = false,
): Promise<{
  success: boolean;
  chunksCreated?: number;
  chunksUpdated?: number;
  chunksUnchanged?: number;
  error?: string;
}> {
  try {
    // Verify user has access to this page
    const userPage = await db.query.users_pages.findFirst({
      where: and(
        eq(users_pages.page_id, pageId),
        eq(users_pages.user_id, userId),
      ),
    });

    if (!userPage) {
      throw new Error("Page not found or unauthorized");
    }

    // Get the page content
    const page = await db.query.pages.findFirst({
      where: and(eq(pages.id, pageId), eq(pages.deleted, false)),
    });

    if (!page || !page.content?.trim()) {
      return {
        success: true,
        chunksCreated: 0,
        chunksUpdated: 0,
        chunksUnchanged: 0,
      };
    }

    // Update node hashes and detect changes
    const nodeHashResult = await updatePageNodeHashes(
      pageId,
      page.content,
      userId,
    );
    if (!nodeHashResult.success) {
      throw new Error(`Failed to update node hashes: ${nodeHashResult.error}`);
    }

    const changedNodes = nodeHashResult.changedNodes || [];
    const hasSignificantChanges = await hasSignificantNodeChanges(
      pageId,
      changedNodes,
    );

    // Skip embedding generation if no significant changes and not forcing
    if (!forceRegenerate && !hasSignificantChanges) {
      console.log(
        `No significant node changes for page ${pageId}, skipping embedding generation`,
      );
      return {
        success: true,
        chunksCreated: 0,
        chunksUpdated: 0,
        chunksUnchanged: await getExistingChunkCount(pageId),
      };
    }

    // Chunk content while preserving node IDs from the start
    const chunker = new NodeAwareChunker();
    const chunksWithNodeIds = await chunker.chunkWithNodeIds(page.content);

    if (chunksWithNodeIds.length === 0) {
      console.log(`No chunkable content found in page ${pageId}`);
      return {
        success: true,
        chunksCreated: 0,
        chunksUpdated: 0,
        chunksUnchanged: 0,
      };
    }

    console.log(
      `Created ${chunksWithNodeIds.length} chunks for page ${pageId}`,
    );

    // Determine which chunks need re-embedding based on changed nodes
    const changedNodeIds = new Set(changedNodes.map((n) => n.nodeId));
    const chunksToUpdate = forceRegenerate
      ? chunksWithNodeIds
      : chunksWithNodeIds.filter((chunk) =>
          chunk.nodeIds.some((nodeId) => changedNodeIds.has(nodeId)),
        );

    let chunksCreated = 0;
    let chunksUpdated = 0;
    let chunksUnchanged = 0;

    if (chunksToUpdate.length > 0) {
      // Get backlinked pages for context
      const contextDocuments = await getBacklinkedPagesContent(pageId, userId);

      // Generate embeddings for chunks that need updating
      const voyageClient = new VoyageContextualEmbeddings();
      const chunksToEmbed = chunksToUpdate.map((c) => c.text);

      const result = await voyageClient.embedPageContentWithContext(
        chunksToEmbed,
        contextDocuments,
      );

      // Handle database updates
      if (forceRegenerate) {
        // Full regeneration: delete all and insert new
        await db.delete(page_chunks).where(eq(page_chunks.page_id, pageId));

        const chunkData = result.chunks.map((chunk, index) => {
          const chunkInfo = chunksToUpdate[index];
          if (!chunkInfo) {
            throw new Error(`Missing chunk info for index ${index}`);
          }

          return {
            page_id: pageId,
            seq: index,
            text: chunk,
            node_ids: chunkInfo.nodeIds,
            embedding: result.embeddings[index],
            hash: createChunkHash(chunk),
          };
        });

        await db.insert(page_chunks).values(chunkData);
        chunksCreated = chunkData.length;
      } else {
        // Incremental update: remove affected chunks and add new ones
        const existingChunks = await db.query.page_chunks.findMany({
          where: eq(page_chunks.page_id, pageId),
          orderBy: page_chunks.seq,
        });

        const chunksToDelete = existingChunks.filter((chunk) => {
          const chunkNodeIds = chunk.node_ids as string[];
          return chunkNodeIds.some((nodeId) => changedNodeIds.has(nodeId));
        });

        // Delete affected chunks
        if (chunksToDelete.length > 0) {
          await db.delete(page_chunks).where(
            and(
              eq(page_chunks.page_id, pageId),
              inArray(
                page_chunks.id,
                chunksToDelete.map((c) => c.id),
              ),
            ),
          );
        }

        // Add new chunks
        const chunkData = result.chunks.map((chunk, index) => {
          const chunkInfo = chunksToUpdate[index];
          if (!chunkInfo) {
            throw new Error(`Missing chunk info for index ${index}`);
          }

          return {
            page_id: pageId,
            seq: 0, // Will be resequenced below
            text: chunk,
            node_ids: chunkInfo.nodeIds,
            embedding: result.embeddings[index],
            hash: createChunkHash(chunk),
          };
        });

        await db.insert(page_chunks).values(chunkData);

        // Resequence all chunks to ensure continuous numbering
        await resequencePageChunks(pageId);

        chunksUpdated = chunkData.length;
        chunksUnchanged = existingChunks.length - chunksToDelete.length;
      }

      console.log(
        `Updated embeddings for page ${pageId}: ${chunksCreated || chunksUpdated} chunks processed`,
      );
    } else {
      chunksUnchanged = await getExistingChunkCount(pageId);
    }

    return {
      success: true,
      chunksCreated,
      chunksUpdated,
      chunksUnchanged,
    };
  } catch (error) {
    console.error("Error generating page embeddings with context:", error);

    Sentry.captureException(error, {
      tags: { operation: "generate_page_embeddings_with_context" },
      extra: { pageId, userId, forceRegenerate },
    });

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate embeddings",
    };
  }
}

// Batch processing function
export async function generateEmbeddingsForPages(
  pageIds: string[],
  userId: string,
  forceRegenerate: boolean = false,
): Promise<{
  success: boolean;
  processedPages?: number;
  failedPages?: string[];
  stats?: {
    chunksCreated: number;
    chunksUpdated: number;
    chunksUnchanged: number;
  };
  error?: string;
}> {
  try {
    const failedPages: string[] = [];
    let processedPages = 0;
    const stats = { chunksCreated: 0, chunksUpdated: 0, chunksUnchanged: 0 };

    console.log(
      `Starting incremental embedding generation for ${pageIds.length} pages`,
    );

    for (const pageId of pageIds) {
      try {
        const result = await generatePageEmbeddingsWithContext(
          pageId,
          userId,
          forceRegenerate,
        );
        if (result.success) {
          processedPages++;
          stats.chunksCreated += result.chunksCreated || 0;
          stats.chunksUpdated += result.chunksUpdated || 0;
          stats.chunksUnchanged += result.chunksUnchanged || 0;
          console.log(`✓ Generated embeddings for page ${pageId}`);
        } else {
          failedPages.push(pageId);
          console.log(
            `✗ Failed to generate embeddings for page ${pageId}: ${result.error}`,
          );
        }
      } catch (error) {
        failedPages.push(pageId);
        console.error(
          `✗ Error generating embeddings for page ${pageId}:`,
          error,
        );
      }
    }

    console.log(
      `Incremental embedding generation complete: ${processedPages} success, ${failedPages.length} failed`,
      `Stats: ${stats.chunksCreated} created, ${stats.chunksUpdated} updated, ${stats.chunksUnchanged} unchanged`,
    );

    return {
      success: true,
      processedPages,
      failedPages: failedPages.length > 0 ? failedPages : undefined,
      stats,
    };
  } catch (error) {
    console.error("Error in batch incremental embedding generation:", error);
    Sentry.captureException(error, {
      tags: { operation: "batch_generate_embeddings_incremental" },
      extra: { pageIds, userId, forceRegenerate },
    });

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate embeddings",
    };
  }
}

// Updated search function that exposes node IDs for citations
export async function searchSimilarChunks(
  query: string,
  userId: string,
  limit: number = 10,
): Promise<
  Array<{
    chunk: typeof page_chunks.$inferSelect;
    page: { id: string; title: string };
    similarity: number;
    nodeIds: string[]; // For citations
  }>
> {
  try {
    // Generate embedding for the query
    const voyageClient = new VoyageContextualEmbeddings();
    const queryResult = await voyageClient.embedPageContent(query);
    const queryEmbedding = queryResult.embeddings[0];

    if (!queryEmbedding || queryResult.embeddings.length === 0) {
      throw new Error("Failed to generate query embedding");
    }

    // Search for similar chunks using cosine similarity
    const similarChunks = await db.execute(sql`
      SELECT 
        pc.*,
        p.id as page_id,
        p.title as page_title,
        (pc.embedding <=> ${queryEmbedding}::vector) * -1 + 1 as similarity
      FROM ${page_chunks} pc
      INNER JOIN ${pages} p ON pc.page_id = p.id
      INNER JOIN ${users_pages} up ON p.id = up.page_id
      WHERE up.user_id = ${userId}
        AND p.deleted = false
      ORDER BY pc.embedding <=> ${queryEmbedding}::vector
      LIMIT ${limit}
    `);

    return similarChunks.rows.map((row: any) => {
      const nodeIds = (row.node_ids as string[]) || [];

      return {
        chunk: {
          id: row.id,
          page_id: row.page_id,
          seq: row.seq,
          text: row.text,
          node_ids: nodeIds,
          embedding: row.embedding,
          hash: row.hash,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
        page: {
          id: row.page_id,
          title: row.page_title,
        },
        similarity: parseFloat(row.similarity),
        nodeIds, // Clean access for citations
      };
    });
  } catch (error) {
    console.error("Error searching similar chunks:", error);
    Sentry.captureException(error);
    return [];
  }
}

// Helper function to resequence chunks after insertions/deletions
async function resequencePageChunks(pageId: string): Promise<void> {
  const chunks = await db.query.page_chunks.findMany({
    where: eq(page_chunks.page_id, pageId),
    orderBy: page_chunks.created_at, // Order by creation time for consistency
  });

  // Update sequence numbers
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk) {
      await db
        .update(page_chunks)
        .set({ seq: i })
        .where(eq(page_chunks.id, chunk.id));
    }
  }
}

// Helper function to get existing chunk count
async function getExistingChunkCount(pageId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(page_chunks)
    .where(eq(page_chunks.page_id, pageId));

  return result[0]?.count || 0;
}

// Get content from backlinked pages for context
async function getBacklinkedPagesContent(
  pageId: string,
  userId: string,
): Promise<string[]> {
  try {
    // Get both incoming and outgoing links
    const [outgoingLinks, incomingLinks] = await Promise.all([
      // Outgoing links (pages this page links to)
      db.query.pages_edges.findMany({
        where: eq(pages_edges.source_page_id, pageId),
        with: {
          targetPage: {
            columns: { id: true, content: true, title: true },
          },
        },
      }),
      // Incoming links (pages that link to this page)
      db.query.pages_edges.findMany({
        where: eq(pages_edges.target_page_id, pageId),
        with: {
          sourcePage: {
            columns: { id: true, content: true, title: true },
          },
        },
      }),
    ]);

    // Extract unique linked pages
    const linkedPages = new Map<string, { content: string; title: string }>();

    outgoingLinks.forEach((link) => {
      if (link.targetPage.content) {
        linkedPages.set(link.targetPage.id, {
          content: link.targetPage.content,
          title: link.targetPage.title,
        });
      }
    });

    incomingLinks.forEach((link) => {
      if (link.sourcePage.content) {
        linkedPages.set(link.sourcePage.id, {
          content: link.sourcePage.content,
          title: link.sourcePage.title,
        });
      }
    });

    // Verify user has access to linked pages
    const linkedPageIds = Array.from(linkedPages.keys());
    if (linkedPageIds.length === 0) {
      return [];
    }

    const accessiblePages = await db.query.users_pages.findMany({
      where: and(
        eq(users_pages.user_id, userId),
        sql`${users_pages.page_id} = ANY(${linkedPageIds})`,
      ),
    });

    const accessiblePageIds = new Set(accessiblePages.map((up) => up.page_id));

    // Filter and prepare context documents
    const contextDocuments: string[] = [];
    for (const [pageId, pageData] of linkedPages) {
      if (accessiblePageIds.has(pageId)) {
        // Clean the content and truncate if needed
        const cleanContent = stripHtmlForChunking(pageData.content);
        const contextText = `${pageData.title}\n\n${cleanContent}`;
        contextDocuments.push(contextText.slice(0, 2000)); // Limit context size
      }
    }

    console.log(
      `Found ${contextDocuments.length} context documents for page ${pageId}`,
    );
    return contextDocuments;
  } catch (error) {
    console.error("Error getting backlinked pages content:", error);
    return [];
  }
}

// Enhanced HTML cleaning for better chunking
function stripHtmlForChunking(html: string): string {
  return (
    html
      // Replace block elements with double line breaks to preserve structure
      .replace(/<\/(h[1-6]|p|div|blockquote|li)>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      // Remove all HTML tags
      .replace(/<[^>]*>/g, " ")
      // Decode HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n\s*/g, "\n\n")
      .trim()
  );
}

function createChunkHash(text: string): string {
  // Simple hash function - you might want to use crypto.createHash for production
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}
