import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import { type Card } from "~/server/queries/card";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY! });

const cardSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  page_id: z.string(),
  resource_id: z.string().nullable(),
  content: z.string(),
  image_cid: z.string().nullable(),
  description: z.string().nullable(),
  last_reviewed: z.string().nullable(),
  next_review: z.string().nullable(),
  mastered_at: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted: z.boolean(),
});
export type CardSchema = z.infer<typeof cardSchema>;

interface RequestBody {
  cards: Card[];
  type: "question-answer" | "cloze";
}

const requestSchema = z.object({
  cards: z.array(cardSchema),
  type: z.enum(["question-answer", "cloze"]),
});

function constructQAPrompt(cards: { content: string; id: string }[]) {
  const paragraphs = cards
    .map((card) => {
      return `Paragraph ${card.id}:\n${card.content}`;
    })
    .join("\n\n");

  return `You will be given an array of paragraphs, each with a corresponding ID. Your task is to create flashcards in the form of questions and answers based on these paragraphs. Here's the array of paragraphs:

<paragraphs>
${paragraphs}
</paragraphs>

Follow these steps to create the flashcards:

1. Process each paragraph individually.
2. For each paragraph, create one question and one answer that captures the main idea or an important detail from that paragraph.
3. Ensure that the question and answer are based solely on the information provided in that specific paragraph.
4. Include the corresponding ID with each flashcard.

Output your flashcards in the following format:

<flashcard>
<id>[Paragraph ID]</id>
<question>[Question based on the paragraph]</question>
<answer>[Answer based on the paragraph]</answer>
</flashcard>

Remember, there should be a strict one-to-one relationship between paragraphs and flashcards. Do not combine information from multiple paragraphs into a single flashcard.

Here's an example of how your output should look:

<flashcard>
<id>f6efdad7-7d7a-49bc-baec-53dde4b68c65</id>
<question>What does the current dogma say about the creation and expansion of the universe?</question>
<answer>According to current dogma, the universe was created about 13.6 billion years ago and underwent an almost immediate but transient expansion at speeds vastly exceeding the velocity of light.</answer>
</flashcard>

Create flashcards for all the paragraphs in the given array, following this format and guidelines.`;
}

function constructClozePrompt(cards: { content: string; id: string }[]) {
  const paragraphs = cards
    .map((card) => {
      return `Paragraph ${card.id}:\n${card.content}`;
    })
    .join("\n\n");

  return `You are tasked with creating flashcards from an array of paragraphs. Each flashcard should have a fill-in-the-blank question on one side and the full sentence on the other side. Follow these instructions carefully:

1. You will be given an array of paragraph objects. Each object contains a 'content' field with the paragraph text and an 'id' field with a unique identifier. The array will be provided in the following format:

<paragraphs_array>
${paragraphs}
</paragraphs_array>

2. For each paragraph in the array, create one flashcard using the following guidelines:
   a. Choose a sentence from the paragraph that contains a meaningful and relevant term or concept.
   b. Create a fill-in-the-blank version of the sentence by removing a key word or phrase.
   c. The removed word should be significant to the meaning of the sentence, not a filler word like "is," "or," or "that."

3. Format each flashcard as follows:
   <flashcard>
   <id>[Insert the corresponding paragraph id here]</id>
   <question>[Insert the fill-in-the-blank sentence here]</question>
   <answer>[Insert the full sentence here]</answer>
   </flashcard>

4. Examples of good flashcards:
   Good: The universe was created at some specific moment some 13.6 _______ years ago. (billion)
   Good: Tags on this platform function differently because the goal is to organize the _______, not just individual notes. (community)

   Examples of bad flashcards:
   Bad: The universe _______ created at some specific moment some 13.6 billion years ago. (was)
   Bad: Tags on this platform function _______ from what you are used to. (differently)

5. Make sure each flashcard has the corresponding id that matches the paragraph it came from.

6. Create multiple flashcards for longer paragraphs if there are multiple key concepts or terms that can be turned into good fill-in-the-blank questions.

7. Output all flashcards you create, ensuring that each one follows the specified format and guidelines.`;
}

function parseQAResponse(text: string) {
  const regex =
    /<flashcard>\s*<id>(.*?)<\/id>\s*<question>(.*?)<\/question>\s*<answer>(.*?)<\/answer>\s*<\/flashcard>/gs;

  const flashcards: { id: string; question: string; answer: string }[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    flashcards.push({
      id: match[1]?.trim() ?? "",
      question: match[2]?.trim() ?? "",
      answer: match[3]?.trim() ?? "",
    });
  }
  return flashcards;
}

function parseClozeResponse(text: string) {
  const regex =
    /<flashcard>\s*<id>(.*?)<\/id>\s*<question>(.*?)<\/question>\s*<answer>(.*?)<\/answer>\s*<\/flashcard>/gs;

  const flashcards: { id: string; question: string; answer: string }[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    // For cloze, we want to ensure the blank is represented consistently
    const question = match[2]?.trim().replace(/_{3,}/g, "_____") ?? "";
    const answer = match[3]?.trim() ?? "";

    flashcards.push({
      id: match[1]?.trim() ?? "",
      question,
      answer,
    });
  }
  return flashcards;
}

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();
    const { cards, type } = requestSchema.parse(body);

    const prompt =
      type === "question-answer"
        ? constructQAPrompt(cards)
        : constructClozePrompt(cards);

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const textContent = response.text ?? "";

    // Parse response based on type
    const flashcards =
      type === "question-answer"
        ? parseQAResponse(textContent)
        : parseClozeResponse(textContent);

    if (flashcards.length === 0) {
      throw new Error("No flashcards found in response");
    }

    const flashcardMap = new Map(
      flashcards.map((card) => [
        card.id,
        {
          question: card.question,
          answer: card.answer,
        },
      ]),
    );

    const enhancedCards = cards.map((card) => {
      const flashcardData = flashcardMap.get(card.id);
      return {
        ...card,
        question: flashcardData?.question || null,
        answer: flashcardData?.answer || null,
      };
    });

    return NextResponse.json({ flashcards: enhancedCards });
  } catch (error) {
    console.error("Error generating flashcards:", error);
    return NextResponse.json(
      { error: "Failed to generate flashcards" },
      { status: 500 },
    );
  }
}
