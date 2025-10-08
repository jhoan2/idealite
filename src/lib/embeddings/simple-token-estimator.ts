// src/lib/embeddings/simple-token-estimator.ts
export class SimpleTokenEstimator {
  // Rough estimation: 1 token ≈ 4 characters for most text
  private readonly CHARS_PER_TOKEN = 4;

  async countTokens(text: string): Promise<number> {
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }

  async countTokensInChunks(chunks: string[]): Promise<{
    total: number;
    perChunk: number[];
    chunksOverLimit: string[];
  }> {
    const perChunk: number[] = [];
    const chunksOverLimit: string[] = [];
    let total = 0;

    for (const chunk of chunks) {
      const count = await this.countTokens(chunk);
      perChunk.push(count);
      total += count;

      if (count > 1000) {
        chunksOverLimit.push(chunk);
      }
    }

    return { total, perChunk, chunksOverLimit };
  }
}
