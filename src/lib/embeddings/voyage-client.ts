// src/lib/embeddings/voyage-client.ts
import {
  SimpleContentChunker,
  type ChunkResult,
} from "./simple-content-chunker";
import * as Sentry from "@sentry/nextjs";

export interface VoyageEmbeddingResult {
  embeddings: number[][];
  chunks: string[];
  metadata: {
    totalTokens: number;
    chunkCount: number;
    avgTokensPerChunk: number;
    model: string;
  };
}

export class VoyageContextualEmbeddings {
  private chunker: SimpleContentChunker;
  private apiKey: string;
  private readonly CHARS_PER_TOKEN = 4;

  constructor() {
    this.chunker = new SimpleContentChunker();
    this.apiKey = process.env.VOYAGER_API_KEY!;

    if (!this.apiKey) {
      throw new Error("VOYAGER_API_KEY environment variable is required");
    }
  }

  // Simple token estimation
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }

  // Original method for backward compatibility
  async embedPageContent(content: string): Promise<VoyageEmbeddingResult> {
    const chunkResult = await this.chunker.chunkContent(content);
    return this.embedPageContentWithContext(chunkResult.chunks, []);
  }

  // New method with context support
  async embedPageContentWithContext(
    chunks: string[],
    contextDocuments: string[] = [],
  ): Promise<VoyageEmbeddingResult> {
    try {
      if (chunks.length === 0) {
        throw new Error("No chunks provided for embedding");
      }

      // Estimate tokens
      const chunkTokens = chunks.reduce(
        (sum, chunk) => sum + this.estimateTokens(chunk),
        0,
      );
      const contextTokens = contextDocuments.reduce(
        (sum, doc) => sum + this.estimateTokens(doc),
        0,
      );
      const totalTokens = chunkTokens + contextTokens;

      console.log(
        `Processing ${chunks.length} chunks (~${chunkTokens} tokens) with ${contextDocuments.length} context docs (~${contextTokens} tokens)`,
      );

      // Check token limits with safety buffer
      const maxTokens = 100_000; // Conservative limit
      if (totalTokens > maxTokens) {
        // Trim context if needed
        const availableForContext = maxTokens - chunkTokens;
        if (availableForContext < contextTokens) {
          console.log(`Trimming context documents due to token limit`);
          contextDocuments = this.trimContextToTokenLimit(
            contextDocuments,
            availableForContext,
          );
        }
      }

      if (chunks.length > 15_000) {
        // Conservative limit
        throw new Error(`Chunk count (${chunks.length}) exceeds safe limit`);
      }

      // Prepare the request payload
      const requestPayload: any = {
        inputs: [chunks],
        model: "voyage-context-3",
        input_type: "document",
        output_dimension: 1024,
      };

      // Add context documents if available
      if (contextDocuments.length > 0) {
        requestPayload.documents = contextDocuments;
      }

      // Call Voyage API
      const response = await fetch(
        "https://api.voyageai.com/v1/contextualizedembeddings",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Voyage API error: ${error.message || response.statusText}`,
        );
      }

      const data = await response.json();
      if (!data || !data.data || !Array.isArray(data.data)) {
        throw new Error(
          `Invalid API response structure: ${JSON.stringify(data)}`,
        );
      }

      // Extract embeddings from the data array
      const embeddings = data.data.map((item: any) => item.embedding);

      if (embeddings.length === 0) {
        throw new Error("No embeddings returned from API");
      }

      console.log(
        `✓ Generated ${embeddings.length} embeddings with ${contextDocuments.length} context documents`,
      );

      return {
        embeddings,
        chunks,
        metadata: {
          totalTokens: data.usage?.total_tokens || totalTokens,
          chunkCount: chunks.length,
          avgTokensPerChunk: Math.round(
            (data.usage?.total_tokens || totalTokens) / chunks.length,
          ),
          model: data.model || "voyage-context-3",
        },
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: "voyage_contextualized_embedding" },
        extra: {
          chunkCount: chunks.length,
          contextDocCount: contextDocuments.length,
        },
      });
      throw error;
    }
  }

  // Helper method to trim context documents to fit token limit
  private trimContextToTokenLimit(
    contextDocuments: string[],
    maxTokens: number,
  ): string[] {
    const trimmedContext: string[] = [];
    let usedTokens = 0;

    for (const doc of contextDocuments) {
      const docTokens = this.estimateTokens(doc);
      if (usedTokens + docTokens <= maxTokens) {
        trimmedContext.push(doc);
        usedTokens += docTokens;
      } else {
        // Try to fit a truncated version
        const remainingTokens = maxTokens - usedTokens;
        if (remainingTokens > 25) {
          // Only bother if we have reasonable space
          const maxChars = Math.floor(
            remainingTokens * this.CHARS_PER_TOKEN * 0.8,
          );
          const truncatedDoc = doc.slice(0, maxChars) + "...";
          trimmedContext.push(truncatedDoc);
        }
        break;
      }
    }

    console.log(
      `Trimmed context from ${contextDocuments.length} to ${trimmedContext.length} documents`,
    );
    return trimmedContext;
  }
}
