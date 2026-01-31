import { serve } from "@upstash/workflow/nextjs";
import { GoogleGenAI } from "@google/genai";

import { env } from "~/env";
import {
  updateDiscordMessage,
  createButtonRow,
} from "~/lib/discord";

// Initialize Gemini client
const genAI = new GoogleGenAI({ apiKey: env.GOOGLE_GEMINI_API_KEY });

// Gemini models
const TEXT_MODEL_ID = "gemini-2.0-flash";
const IMAGE_MODEL_ID = "gemini-2.5-flash-image";

// Types
interface WorkflowPayload {
  discordUserId: string;
  notes: string;
  channelId: string;
  interactionToken: string;
  applicationId: string;
  remainingGenerations: number;
}

interface SROFact {
  id: number;
  subject: string;
  relation: string;
  object: string;
  value_type: string;
  reasoning: string;
}

// Prompts
const LEARNING_ARCHITECT_PROMPT = `**Role:** You are a Senior Learning Architect specializing in Technical Information Extraction. Your goal is to convert messy, unstructured study notes into a "High-Resolution Markdown Outline."

**Objective:**
Take the provided unstructured text and transform it into a hierarchical outline.

1. **If the text is dense/noisy:** Strip away filler, conversational language, and citations. Keep only the technical "nuggets."
2. **If the text is thin/bulleted:** Use your internal knowledge to expand on the "Implied Context." (e.g., If the user writes "Warfarin - Vit K," you expand it to "Warfarin acts as a Vitamin K Antagonist by inhibiting epoxide reductase.")

**Output Format (Strict Markdown):**
- Use \`#\` for the Main Topic.
- Use \`##\` for Major Categories/Phases/Systems.
- Use \`###\` for Specific Mechanisms or Facts.
- Use standard bullet points for details.

**Refinery Rules:**
- **Term Normalization:** Ensure all technical terms are spelled correctly and used consistently.
- **Context Retention:** Never leave a fact "floating." Every detail must be nested under its relevant category so its meaning is preserved.
- **No Fluff:** Do not include "In this section we will learn..." or "As previously mentioned..."

**Text to Process:**
`;

const MNEMONIC_ANALYST_PROMPT = `**Role:** You are a **Mnemonic Analyst**. Your task is to take a structured outline of study notes and identify the "High-Value" fact atoms that require visual memorization.

### **Selection Criteria (The "High-Yield" Filter)**
Scan the outline and extract 3–5 facts. A fact is "High-Value" if it meets at least one of these criteria:
1. **Arbitrary Lists:** Numbers, dosages, or lists of names (e.g., "Factors II, VII, IX, X").
2. **Confusability:** Concepts that students often flip-flop (e.g., "Anaphase vs. Telophase").
3. **Abstract Technicality:** Terms with no inherent visual meaning (e.g., "Amiodarone").
4. **Causal Pivot:** A specific "Trigger" and "Result" (e.g., "Calcium binds to Troponin").

### **The Output Format (The Triplet)**
For every high-value fact, you must output a JSON object with a **Subject-Relation-Object (SRO)** structure.

**Constraints:**
- **Context Injection:** If a bullet point is under a specific heading (e.g., "Telophase"), that heading _must_ be included in the Subject or Object to prevent "orphaned" facts.
- **Atomization:** If a fact contains multiple actions, split it into two separate objects.
- **JSON Only:** Your response must be a valid JSON array. Do not include any preamble, conversational text, or markdown code blocks.

---

**Example Input (Outline):**
> **Topic: Mitosis**
> - **Anaphase**
>   - Separation of sister chromatids.
>   - Chromosome number doubles.

**Example Output (JSON):**
[
  {
    "id": 1,
    "subject": "Sister Chromatids",
    "relation": "separate during",
    "object": "Anaphase Stage",
    "value_type": "physical_action",
    "reasoning": "High-yield visual for the core mechanism of this phase."
  },
  {
    "id": 2,
    "subject": "Chromosome Number",
    "relation": "doubles during",
    "object": "Anaphase Stage",
    "value_type": "numeric",
    "reasoning": "Numeric fact that is frequently tested."
  }
]

---

**Outline to Process:**
`;

export const { POST } = serve<WorkflowPayload>(
  async (context) => {
    const { notes, interactionToken, applicationId, remainingGenerations } =
      context.requestPayload;
    const workflowRunId = context.workflowRunId;

    // Step 1: Structure notes with Gemini
    const structuredOutline = await context.run("structure-notes", async () => {
      const response = await genAI.models.generateContent({
        model: TEXT_MODEL_ID,
        contents: LEARNING_ARCHITECT_PROMPT + notes,
      });
      return (
        response.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0, 4000) ??
        notes
      );
    });

    // Step 2: Extract facts with Gemini
    const facts = await context.run("extract-facts", async () => {
      const response = await genAI.models.generateContent({
        model: TEXT_MODEL_ID,
        contents: MNEMONIC_ANALYST_PROMPT + structuredOutline,
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return [
          {
            id: 1,
            subject: "Your Notes",
            relation: "contain",
            object: "Key Concepts",
            value_type: "general",
            reasoning: "Fallback when extraction fails",
          },
        ] as SROFact[];
      }

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [
          {
            id: 1,
            subject: "Your Notes",
            relation: "contain",
            object: "Key Concepts",
            value_type: "general",
            reasoning: "Fallback when parsing fails",
          },
        ] as SROFact[];
      }

      try {
        return JSON.parse(jsonMatch[0]) as SROFact[];
      } catch {
        return [
          {
            id: 1,
            subject: "Your Notes",
            relation: "contain",
            object: "Key Concepts",
            value_type: "general",
            reasoning: "Fallback when JSON parsing fails",
          },
        ] as SROFact[];
      }
    });

    // Step 3: Send facts as buttons to Discord
    await context.run("send-facts", async () => {
      const buttonOptions = facts.slice(0, 5).map((fact) => ({
        id: String(fact.id),
        label: `${fact.subject} ${fact.relation} ${fact.object}`.slice(0, 80),
      }));

      const factList = facts
        .slice(0, 5)
        .map(
          (f, i) => `${i + 1}. **${f.subject}** ${f.relation} **${f.object}**`,
        )
        .join("\n");

      await updateDiscordMessage(applicationId, interactionToken, {
        content: `**Found ${facts.length} key facts:**\n\n${factList}\n\n_Select one to learn more_\n_${remainingGenerations} generations remaining_`,
        components: [createButtonRow(buttonOptions, `fact:${workflowRunId}`)],
      });
    });

    // Step 4: Wait for user selection
    const selection = await context.waitForEvent<{ factId: string }>(
      "wait-for-fact",
      `fact-selected-${workflowRunId}`,
      { timeout: "10m" },
    );

    const selectedFact =
      facts.find((f) => String(f.id) === selection.eventData.factId) ??
      facts[0];

    // Step 5: Show selected fact details
    await context.run("show-result", async () => {
      await updateDiscordMessage(applicationId, interactionToken, {
        content: `**You selected:**\n\n**${selectedFact?.subject}** ${selectedFact?.relation} **${selectedFact?.object}**\n\n_Why this matters:_ ${selectedFact?.reasoning}`,
        components: [],
      });
    });
  },
  {
    failureFunction: async ({ context, failStatus, failResponse }) => {
      console.error("Workflow failed:", failStatus, failResponse);
      const { applicationId, interactionToken } = context.requestPayload;
      try {
        await updateDiscordMessage(applicationId, interactionToken, {
          content: `**Failed:** ${failResponse.includes("timeout") ? "Selection timed out" : "An error occurred"}`,
          components: [],
        });
      } catch (error) {
        console.error("Failed to send error message:", error);
      }
    },
  },
);
