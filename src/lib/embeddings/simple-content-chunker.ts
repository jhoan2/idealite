// src/lib/embeddings/simple-content-chunker.ts
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export interface ChunkResult {
  chunks: string[];
  tokenCounts: number[];
  totalTokens: number;
  withinLimits: boolean;
  warnings: string[];
}

export class SimpleContentChunker {
  private textSplitter: RecursiveCharacterTextSplitter;
  private readonly CHARS_PER_TOKEN = 4; // Simple estimation

  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", ". ", " ", ""],
    });
  }

  async chunkContent(content: string): Promise<ChunkResult> {
    const warnings: string[] = [];

    // Remove HTML tags for cleaner chunking
    const cleanContent = this.stripHtml(content);

    // Use LangChain's proven chunking
    const chunks = await this.textSplitter.splitText(cleanContent);

    // Simple token estimation
    const tokenCounts = chunks.map((chunk) =>
      Math.ceil(chunk.length / this.CHARS_PER_TOKEN),
    );
    const totalTokens = tokenCounts.reduce((sum, count) => sum + count, 0);

    // Check limits with buffer for safety
    const maxTokens = 100_000; // Use lower limit for safety
    const maxChunks = 15_000; // Use lower limit for safety

    if (totalTokens > maxTokens) {
      warnings.push(
        `Total estimated tokens (${totalTokens}) may exceed Voyage limit`,
      );
    }

    if (chunks.length > maxChunks) {
      warnings.push(
        `Chunk count (${chunks.length}) exceeds Voyage limit (16,000)`,
      );
    }

    const chunksOverLimit = chunks.filter(
      (_, i) => (tokenCounts[i] ?? 0) > 1000,
    );
    if (chunksOverLimit.length > 0) {
      warnings.push(
        `${chunksOverLimit.length} chunks may exceed recommended size`,
      );
    }

    return {
      chunks: chunks.filter((chunk) => chunk.trim().length > 0),
      tokenCounts,
      totalTokens,
      withinLimits: totalTokens <= maxTokens && chunks.length <= maxChunks,
      warnings,
    };
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }
}
