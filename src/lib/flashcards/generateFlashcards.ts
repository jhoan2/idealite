import OpenAI from "openai";
import { Chunk } from "./chunkHtmlGeneric";
import { SplitChunk } from "./semanticHtmlSplitter";
import { chunkInto } from "./helpers";

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Interface for the processed cards ready for persistence
export interface PersistableCard {
  pageId: string;
  question: string;
  answer: string;
  primaryId: string;
  additional: string[];
}

// Define the tool for OpenAI function calling
const TOOL_DEF = [
  {
    type: "function" as const,
    function: {
      name: "createCards",
      description: "Return 1-3 flashcards for each chunk",
      parameters: {
        type: "object",
        properties: {
          flashcards: {
            type: "array",
            items: {
              type: "object",
              required: ["question", "answer", "citations"],
              properties: {
                question: { type: "string" },
                answer: { type: "string" },
                citations: {
                  type: "array",
                  items: { type: "string" }, // nodeIds
                  minItems: 1,
                },
              },
            },
          },
        },
        required: ["flashcards"],
      },
    },
  },
];

// System prompt for the flashcard generation
const SYSTEM = `
You write spaced-repetition flashcards.
For EVERY fact include a citation (nodeId from AllowedIds) in "citations".
No uncited statements. 1-3 cards max per chunk.`;

type ChunkWithNodeIds = Chunk | SplitChunk;

/**
 * Generates flashcards from HTML chunks
 * Each chunk is batched with others to reduce API calls
 */
export async function cardsForChunks(
  chunks: ChunkWithNodeIds[],
  pageId: string,
): Promise<PersistableCard[]> {
  const batches = chunkInto(chunks, 5); // 5 chunks ⇒ 1 request
  const results: PersistableCard[] = [];

  for (const batch of batches) {
    const messages = batch.map((c, idx) => ({
      role: "user" as const,
      content: `
<<<CHUNK_${idx}>>>
AllowedIds = [${getAllNodeIds(c)
        .map((id) => `"${id}"`)
        .join(", ")}]

${getAllNodeIds(c)
  .map((id, i) => `[${id}] ${c.text.split("\n")[i] ?? ""}`)
  .join("\n")}

<<<END>>>
Generate flashcards for this chunk.`,
    }));

    try {
      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.5,
        tools: TOOL_DEF,
        tool_choice: { type: "function", function: { name: "createCards" } },
        messages: [{ role: "system", content: SYSTEM }, ...messages],
      });

      const toolCall = resp.choices[0]?.message.tool_calls?.[0];
      if (!toolCall || !toolCall.function || !toolCall.function.arguments)
        continue;

      const data = JSON.parse(toolCall.function.arguments) as {
        flashcards: { question: string; answer: string; citations: string[] }[];
      };

      for (const fc of data.flashcards) {
        if (fc.citations.length > 0) {
          results.push({
            pageId,
            question: fc.question.trim(),
            answer: fc.answer.trim(),
            primaryId: fc.citations[0] || "",
            additional: fc.citations.slice(1),
          });
        }
      }
    } catch (error) {
      console.error("Error generating flashcards:", error);
    }
  }
  return results;
}

// Helper function to get all node IDs from either chunk type
function getAllNodeIds(chunk: ChunkWithNodeIds): string[] {
  if ("nodeIds" in chunk) {
    return chunk.nodeIds;
  } else {
    return [chunk.primaryId, ...chunk.additionalIds].filter(
      Boolean,
    ) as string[];
  }
}
