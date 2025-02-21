import { GoogleGenerativeAI } from "@google/generative-ai";
import { Redis } from "@upstash/redis";
import * as Sentry from "@sentry/nextjs";
import { v4 as uuidv4 } from "uuid";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface TriviaQuestion {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: "A" | "B" | "C" | "D";
  metadata: {
    difficulty: string;
    category: string;
  };
}

export async function generateAndCacheQuestions(topic: string) {
  try {
    const questions = await generateQuestionsWithLLM(topic);
    for (const q of questions) {
      let id = uuidv4();
      q.id = id;
      await redis.set(`trivia:${topic}:${id}`, JSON.stringify(q));
    }
  } catch (error) {
    console.error("Failed to generate questions:", error);
    Sentry.captureException(error);
  }
}

function parseLLMOutput(text: string): any {
  // Check for markdown code fences and remove them.
  if (text.startsWith("```")) {
    const regex = /```(?:json)?\s*([\s\S]*?)```/m;
    const match = text.match(regex);
    if (match && match[1]) {
      text = match[1].trim();
    }
  }
  return JSON.parse(text);
}

async function generateQuestionsWithLLM(topic: string) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    You are tasked with generating 30 basic multiple-choice questions on a given topic. 
    Each question should have four options and one correct answer. The output should be formatted
     in a specific JSON structure.
    
     You will be given a topic as a string in the following format:
      <topic>
      ${topic}
      </topic>

      To complete this task, follow these steps:

      1. Generate 30 unique questions related to the provided topic. Ensure that the questions cover 
      various aspects of the topic and are suitable for basic knowledge testing.

      2. For each question, create four multiple-choice options (A, B, C, and D). Make sure that only
       one option is correct and the others are plausible but incorrect.

      3. Format your output as a JSON object with the following structure:
      - The main object should have a single key "questions" with an array value.
      - Each element in the array should be an object representing a question with the following 
      keys:
          - "question": The text of the question (string)
          - "options": An object with keys A, B, C, and D, each containing a string value for the
           respective option
          - "answer": The correct answer option (string, either "A", "B", "C", or "D")

      Here's an example of the expected JSON structure for one question:

      TriviaQuestion {
        id: string;
        question: string;
        options: {
          A: string;
          B: string;
          C: string;
          D: string;
        };
        correctAnswer: "A" | "B" | "C" | "D";
        metadata: {
          difficulty: string;
          category: string;
        };
      }

      Return: Array<TriviaQuestion>
      
      Additional guidelines:
      - Ensure that the questions are clear, concise, and unambiguous.
      - Vary the difficulty level of the questions, but keep them appropriate for basic knowledge testing.
      - Double-check that there is only one correct answer for each question.
      - Make sure the incorrect options are plausible to avoid obvious elimination.
      - Do not repeat questions or use very similar questions.

      Remember to generate exactly 30 questions and format them according to the specified JSON 
      structure. Begin the task now, and provide the complete JSON output containing all 30 questions
      related to the given topic.
    `;

  const response = await model.generateContent(prompt);
  const textContent = response.response.text();

  // Parse the text to JSON
  let questions: TriviaQuestion[];
  try {
    questions = parseLLMOutput(textContent);
  } catch (err) {
    console.error("Error parsing JSON:", err, textContent);
    Sentry.captureException(err);
    throw new Error("Failed to parse generated questions");
  }

  return questions;
}
