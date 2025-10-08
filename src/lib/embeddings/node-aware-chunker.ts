// src/lib/embeddings/node-aware-chunker.ts
import { JSDOM } from "jsdom";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export interface NodeBoundary {
  nodeId: string;
  kind: string;
  startIndex: number;
  endIndex: number;
}

export interface ChunkWithNodeIds {
  text: string;
  nodeIds: string[];
  startIndex: number;
  endIndex: number;
}

export class NodeAwareChunker {
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", ". ", " ", ""],
    });
  }

  /**
   * Extract text and node boundaries in one pass
   */
  private extractTextWithNodeBoundaries(htmlContent: string): {
    text: string;
    boundaries: NodeBoundary[];
  } {
    const boundaries: NodeBoundary[] = [];
    let text = "";
    let currentIndex = 0;

    try {
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;

      // Find all elements with data-node-id
      const elementsWithNodeIds = document.querySelectorAll("[data-node-id]");

      elementsWithNodeIds.forEach((element) => {
        const nodeId = element.getAttribute("data-node-id");
        if (!nodeId) return;

        // Get the text content of this specific element
        const elementText = element.textContent || "";
        if (!elementText.trim()) return;

        // Determine node kind
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
            // For images, use alt text
            const alt = element.getAttribute("alt") || "";
            const src = element.getAttribute("src") || "";
            const imageText = `${alt} ${src}`.trim();
            if (imageText) {
              boundaries.push({
                nodeId,
                kind,
                startIndex: currentIndex,
                endIndex: currentIndex + imageText.length,
              });
              text += imageText + " ";
              currentIndex += imageText.length + 1;
            }
            return;
          default:
            kind = "text";
        }

        // Clean and normalize the text
        const cleanText = elementText.replace(/\s+/g, " ").trim();

        if (cleanText) {
          boundaries.push({
            nodeId,
            kind,
            startIndex: currentIndex,
            endIndex: currentIndex + cleanText.length,
          });

          text += cleanText + " "; // Add space separator
          currentIndex += cleanText.length + 1;
        }
      });

      return { text: text.trim(), boundaries };
    } catch (error) {
      console.error("Error extracting text with node boundaries:", error);
      return { text: "", boundaries: [] };
    }
  }

  /**
   * Find which node boundaries a chunk spans
   */
  private findChunkNodeIds(
    chunkStart: number,
    chunkEnd: number,
    boundaries: NodeBoundary[],
  ): string[] {
    const nodeIds = new Set<string>();

    for (const boundary of boundaries) {
      // Check if chunk overlaps with this node boundary
      const overlapStart = Math.max(chunkStart, boundary.startIndex);
      const overlapEnd = Math.min(chunkEnd, boundary.endIndex);

      if (overlapStart < overlapEnd) {
        // There's an overlap
        nodeIds.add(boundary.nodeId);
      }
    }

    return Array.from(nodeIds);
  }

  /**
   * Chunk content while preserving node ID relationships
   */
  async chunkWithNodeIds(htmlContent: string): Promise<ChunkWithNodeIds[]> {
    // Extract text and node boundaries
    const { text, boundaries } =
      this.extractTextWithNodeBoundaries(htmlContent);

    if (!text.trim() || boundaries.length === 0) {
      return [];
    }

    // Split text into chunks
    const textChunks = await this.textSplitter.splitText(text);

    const chunksWithNodeIds: ChunkWithNodeIds[] = [];
    let searchStart = 0;

    for (const chunk of textChunks) {
      // Find where this chunk appears in the text
      const chunkStart = text.indexOf(chunk, searchStart);

      if (chunkStart === -1) {
        console.warn("Could not find chunk in text:", chunk.slice(0, 50));
        continue;
      }

      const chunkEnd = chunkStart + chunk.length;

      // Find which nodes this chunk spans
      const nodeIds = this.findChunkNodeIds(chunkStart, chunkEnd, boundaries);

      chunksWithNodeIds.push({
        text: chunk,
        nodeIds,
        startIndex: chunkStart,
        endIndex: chunkEnd,
      });

      // Update search start for next iteration
      searchStart = chunkEnd;
    }

    return chunksWithNodeIds;
  }

  /**
   * Alternative: Node-aligned chunking (keeps chunks within node boundaries)
   */
  async chunkByNodes(htmlContent: string): Promise<ChunkWithNodeIds[]> {
    const { text, boundaries } =
      this.extractTextWithNodeBoundaries(htmlContent);

    if (!text.trim() || boundaries.length === 0) {
      return [];
    }

    const chunksWithNodeIds: ChunkWithNodeIds[] = [];

    for (const boundary of boundaries) {
      const nodeText = text.slice(boundary.startIndex, boundary.endIndex);

      if (nodeText.length > 1000) {
        // If node is too large, split it while preserving the node ID
        const subChunks = await this.textSplitter.splitText(nodeText);

        for (const subChunk of subChunks) {
          chunksWithNodeIds.push({
            text: subChunk,
            nodeIds: [boundary.nodeId], // Single node per chunk
            startIndex: boundary.startIndex,
            endIndex: boundary.endIndex,
          });
        }
      } else {
        // Node fits in one chunk
        chunksWithNodeIds.push({
          text: nodeText,
          nodeIds: [boundary.nodeId],
          startIndex: boundary.startIndex,
          endIndex: boundary.endIndex,
        });
      }
    }

    return chunksWithNodeIds;
  }
}
