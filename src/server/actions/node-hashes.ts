// src/server/actions/node-hashes.ts
"use server";

import { db } from "~/server/db";
import { page_node_hashes, pages, users_pages } from "~/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { createHash } from "crypto";
import { JSDOM } from "jsdom";
import * as Sentry from "@sentry/nextjs";

export interface NodeChange {
  nodeId: string;
  kind: string;
  oldHash?: string;
  newHash: string;
  isNew: boolean;
  isModified: boolean;
}

export interface NodeHashResult {
  success: boolean;
  changedNodes?: NodeChange[];
  totalNodes?: number;
  error?: string;
}

// Extract nodes and their content from HTML
function extractNodesFromHTML(htmlContent: string): Array<{
  nodeId: string;
  kind: string;
  content: string;
}> {
  const nodes: Array<{ nodeId: string; kind: string; content: string }> = [];

  try {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Find all elements with data-node-id attributes
    const elementsWithNodeIds = document.querySelectorAll("[data-node-id]");

    elementsWithNodeIds.forEach((element) => {
      const nodeId = element.getAttribute("data-node-id");
      if (!nodeId) return;

      // Determine node kind based on tag name
      let kind = "text";
      const tagName = element.tagName.toLowerCase();

      switch (tagName) {
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          kind = "heading";
          break;
        case "p":
          kind = "paragraph";
          break;
        case "ul":
        case "ol":
          kind = "list";
          break;
        case "li":
          kind = "list_item";
          break;
        case "blockquote":
          kind = "blockquote";
          break;
        case "pre":
        case "code":
          kind = "code";
          break;
        case "img":
          kind = "image";
          break;
        default:
          kind = "text";
      }

      // Extract text content (for images, use alt text + src)
      let content = "";
      if (kind === "image") {
        const alt = element.getAttribute("alt") || "";
        const src = element.getAttribute("src") || "";
        content = `${alt} ${src}`.trim();
      } else {
        content = element.textContent || "";
      }

      // Only include nodes with actual content
      if (content.trim()) {
        nodes.push({
          nodeId,
          kind,
          content: content.trim(),
        });
      }
    });

    return nodes;
  } catch (error) {
    console.error("Error parsing HTML for node extraction:", error);
    return [];
  }
}

// Generate SHA1 hash of content
function generateContentHash(content: string): string {
  return createHash("sha1").update(content, "utf8").digest("hex");
}

// Update page node hashes and detect changes
export async function updatePageNodeHashes(
  pageId: string,
  htmlContent: string,
  userId?: string,
): Promise<NodeHashResult> {
  try {
    // Verify user access if userId provided
    if (userId) {
      const userPage = await db.query.users_pages.findFirst({
        where: and(
          eq(users_pages.page_id, pageId),
          eq(users_pages.user_id, userId),
        ),
      });

      if (!userPage) {
        throw new Error("Page not found or unauthorized");
      }
    }

    // Extract nodes from HTML
    const extractedNodes = extractNodesFromHTML(htmlContent);

    if (extractedNodes.length === 0) {
      console.log(`No nodes with IDs found in page ${pageId}`);
      return { success: true, changedNodes: [], totalNodes: 0 };
    }

    // Get existing hashes for this page
    const existingHashes = await db.query.page_node_hashes.findMany({
      where: eq(page_node_hashes.page_id, pageId),
    });

    const existingHashMap = new Map(
      existingHashes.map((h) => [h.node_id, { hash: h.hash, kind: h.kind }]),
    );

    // Detect changes
    const changedNodes: NodeChange[] = [];
    const currentNodeIds = new Set<string>();

    for (const node of extractedNodes) {
      currentNodeIds.add(node.nodeId);
      const newHash = generateContentHash(node.content);
      const existing = existingHashMap.get(node.nodeId);

      if (!existing) {
        // New node
        changedNodes.push({
          nodeId: node.nodeId,
          kind: node.kind,
          newHash,
          isNew: true,
          isModified: false,
        });
      } else if (existing.hash !== newHash) {
        // Modified node
        changedNodes.push({
          nodeId: node.nodeId,
          kind: node.kind,
          oldHash: existing.hash,
          newHash,
          isNew: false,
          isModified: true,
        });
      }
    }

    // Handle deletions and updates in transaction
    await db.transaction(async (tx) => {
      // Remove hashes for nodes that no longer exist
      const deletedNodeIds = existingHashes
        .map((h) => h.node_id)
        .filter((nodeId) => !currentNodeIds.has(nodeId));

      if (deletedNodeIds.length > 0) {
        await tx
          .delete(page_node_hashes)
          .where(
            and(
              eq(page_node_hashes.page_id, pageId),
              inArray(page_node_hashes.node_id, deletedNodeIds),
            ),
          );
      }

      // Update or insert current nodes
      for (const node of extractedNodes) {
        const hash = generateContentHash(node.content);

        await tx
          .insert(page_node_hashes)
          .values({
            page_id: pageId,
            node_id: node.nodeId,
            kind: node.kind,
            hash,
            updated_at: new Date(),
          })
          .onConflictDoUpdate({
            target: [page_node_hashes.page_id, page_node_hashes.node_id],
            set: {
              kind: node.kind,
              hash,
              updated_at: new Date(),
            },
          });
      }
    });

    console.log(
      `Updated node hashes for page ${pageId}: ${extractedNodes.length} total nodes, ${changedNodes.length} changed`,
    );

    return {
      success: true,
      changedNodes,
      totalNodes: extractedNodes.length,
    };
  } catch (error) {
    console.error("Error updating page node hashes:", error);

    Sentry.captureException(error, {
      tags: { operation: "update_page_node_hashes" },
      extra: { pageId, userId, contentLength: htmlContent.length },
    });

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update node hashes",
    };
  }
}

// Get changed nodes since last embedding generation
export async function getNodesNeedingReembedding(pageId: string): Promise<{
  success: boolean;
  nodeIds?: string[];
  error?: string;
}> {
  try {
    // For now, this is a simple implementation
    // In the future, you could track when embeddings were last generated
    // and only return nodes changed since then

    const nodeHashes = await db.query.page_node_hashes.findMany({
      where: eq(page_node_hashes.page_id, pageId),
      columns: {
        node_id: true,
      },
    });

    return {
      success: true,
      nodeIds: nodeHashes.map((h) => h.node_id),
    };
  } catch (error) {
    console.error("Error getting nodes needing re-embedding:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get nodes for re-embedding",
    };
  }
}

// Check if page has any node changes that require re-embedding
export async function hasSignificantNodeChanges(
  pageId: string,
  changedNodes: NodeChange[],
): Promise<boolean> {
  // Consider changes significant if:
  // 1. Any nodes were added or modified
  // 2. Changes affect content nodes (not just metadata)

  const significantChanges = changedNodes.filter(
    (change) =>
      (change.isNew || change.isModified) &&
      ["paragraph", "heading", "list_item", "blockquote", "code"].includes(
        change.kind,
      ),
  );

  return significantChanges.length > 0;
}
