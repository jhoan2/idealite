import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { env } from "~/env";
import { authorizeRoute } from "~/lib/api/authorize-route";
import type { FactPair } from "~/lib/ai/types";

const genAI = new GoogleGenAI({ apiKey: env.GOOGLE_GEMINI_API_KEY });
const GENERATOR_MODEL_ID = "gemini-2.0-flash";
const JUDGE_MODEL_ID = "gemini-2.0-flash";
const MAX_ASSOCIATION_ATTEMPTS = 2;

const flashcardSchema = z.object({
  id: z.number().int(),
  question: z.string().min(1),
  answer: z.string().min(1),
});

const requestSchema = z.object({
  flashcards: z.array(flashcardSchema).min(1, "At least one flashcard is required"),
});

const rawAssociationSchema = z.object({
  id: z.number().int().optional(),
  question_key: z.string().min(1),
  answer_key: z.string().min(1),
  link_verb: z.string().min(1).optional(),
  reasoning: z.string().min(1).optional(),
  confidence: z.number().optional(),
});

interface AssociationRow {
  id: number;
  question: string;
  answer: string;
  question_key: string;
  answer_key: string;
  link_verb: string;
  reasoning: string;
  confidence: number;
}

interface RejectedRow {
  id: number;
  reason: string;
}

interface JudgeResult {
  verdict: "pass" | "fail";
  score: number;
  feedback: string;
  critical_issues: string[];
}

interface AttemptSnapshot {
  attempt: number;
  associations: AssociationRow[];
  rejected: RejectedRow[];
  judge: JudgeResult;
}

const judgeResultSchema = z.object({
  verdict: z.enum(["pass", "fail"]),
  score: z.number().int().min(0).max(100),
  feedback: z.string().min(1),
  critical_issues: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    if (!(await authorizeRoute(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const flashcards = parsed.data.flashcards.map((card) => ({
      id: card.id,
      question: normalizeText(card.question),
      answer: normalizeText(card.answer),
    }));

    const attemptSnapshots: AttemptSnapshot[] = [];
    let repairFeedback = "";

    for (let attempt = 1; attempt <= MAX_ASSOCIATION_ATTEMPTS; attempt++) {
      const rawRows = await generateAssociationCandidates({
        flashcards,
        repairFeedback,
      });

      const normalized = normalizeAssociations(rawRows, flashcards);
      const judge = await judgeAssociations({
        flashcards,
        associations: normalized.associations,
        rejected: normalized.rejected,
      });

      attemptSnapshots.push({
        attempt,
        associations: normalized.associations,
        rejected: normalized.rejected,
        judge,
      });

      if (judge.verdict === "pass" && normalized.associations.length > 0) {
        break;
      }

      if (attempt < MAX_ASSOCIATION_ATTEMPTS) {
        repairFeedback = buildRepairFeedback({
          judge,
          rejected: normalized.rejected,
        });
      }
    }

    const bestAttempt = chooseBestAttempt(attemptSnapshots);
    if (!bestAttempt || bestAttempt.associations.length === 0) {
      return NextResponse.json(
        {
          error: "No valid associations extracted from flashcards",
          rejected: bestAttempt?.rejected ?? [],
        },
        { status: 500 },
      );
    }

    const pairs: FactPair[] = bestAttempt.associations.map((row, index) => ({
      pair_id: index + 1,
      fact: `Q: ${row.question} A: ${row.answer}`,
      component_a: row.question_key,
      component_b: row.answer_key,
    }));

    return NextResponse.json({
      success: true,
      data: {
        associations: bestAttempt.associations,
        pairs,
        rejected: bestAttempt.rejected,
        debug: {
          attempt_count: attemptSnapshots.length,
          final_judge_score: bestAttempt.judge.score,
          final_judge_feedback: bestAttempt.judge.feedback,
        },
      },
    });
  } catch (error) {
    console.error("Error extracting associations from flashcards:", error);
    return NextResponse.json(
      { error: "Failed to extract associations from flashcards" },
      { status: 500 },
    );
  }
}

const ASSOCIATION_EXTRACTOR_SYSTEM_PROMPT = `You are a memory-association extractor.

Given flashcards, extract one key term from the question and one key term from the answer that should be linked in memory.

Rules:
1) question_key must be an exact substring of question.
2) answer_key must be an exact substring of answer.
3) Choose discriminative terms that drive recall, not filler words.
4) Keep link_verb short and directional when possible.
5) Return JSON array only.`;

const ASSOCIATION_FEW_SHOTS = `Few-shot examples:

Example 1
Input flashcard:
{
  "id": 1,
  "question": "Which cofactor is required for pyruvate dehydrogenase?",
  "answer": "Thiamine pyrophosphate (TPP)."
}
Output:
{
  "id": 1,
  "question_key": "pyruvate dehydrogenase",
  "answer_key": "Thiamine pyrophosphate (TPP)",
  "link_verb": "requires",
  "reasoning": "Classic enzyme-cofactor test pair.",
  "confidence": 0.95
}

Example 2
Input flashcard:
{
  "id": 2,
  "question": "What electrolyte abnormality causes peaked T waves?",
  "answer": "Hyperkalemia."
}
Output:
{
  "id": 2,
  "question_key": "peaked T waves",
  "answer_key": "Hyperkalemia",
  "link_verb": "is caused by",
  "reasoning": "High-yield ECG finding to diagnosis mapping.",
  "confidence": 0.92
}

Example 3
Input flashcard:
{
  "id": 3,
  "question": "In German vocabulary, what does 'Schmetterling' mean?",
  "answer": "Butterfly."
}
Output:
{
  "id": 3,
  "question_key": "Schmetterling",
  "answer_key": "Butterfly",
  "link_verb": "means",
  "reasoning": "Direct vocab mapping suitable for mnemonic imagery.",
  "confidence": 0.9
}`;

function buildUserPrompt(input: {
  cards: Array<{ id: number; question: string; answer: string }>;
  repairFeedback: string;
}) {
  const repairBlock = input.repairFeedback
    ? `\nRepair feedback from judge (fix these issues):\n${input.repairFeedback}\n`
    : "";

  return `Extract one memory association from each flashcard.

${ASSOCIATION_FEW_SHOTS}

${repairBlock}

Flashcards:
${JSON.stringify(input.cards, null, 2)}

Return JSON array:
[
  {
    "id": number,
    "question_key": "string",
    "answer_key": "string",
    "link_verb": "string",
    "reasoning": "string",
    "confidence": 0.0
  }
]`;
}

const ASSOCIATION_JUDGE_SYSTEM_PROMPT = `You are a strict evaluator for extracted flashcard associations.

Return JSON only:
{
  "verdict": "pass" | "fail",
  "score": 0-100,
  "feedback": "single concise paragraph",
  "critical_issues": ["..."]
}

Scoring guidance:
- 40 points: keys are discriminative and specific
- 30 points: keys are correct and grounded in source question/answer
- 20 points: mapping is useful for mnemonic recall
- 10 points: low duplication/noisy anchors

Mark verdict "pass" if score >= 70 and there are no critical grounding issues.`;

function extractJsonArray(text: string): string {
  const firstBracket = text.indexOf("[");
  const lastBracket = text.lastIndexOf("]");
  if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
    throw new Error("No JSON array found in model response");
  }
  return text.slice(firstBracket, lastBracket + 1);
}

function extractJsonObject(text: string): string {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in model response");
  }
  return text.slice(firstBrace, lastBrace + 1);
}

function normalizeText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function findCaseInsensitiveIndex(haystack: string, needle: string): number {
  return haystack.toLowerCase().indexOf(needle.toLowerCase());
}

function clampConfidence(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0.7;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

async function generateAssociationCandidates(input: {
  flashcards: Array<{ id: number; question: string; answer: string }>;
  repairFeedback: string;
}): Promise<unknown[]> {
  const response = await genAI.models.generateContent({
    model: GENERATOR_MODEL_ID,
    contents: buildUserPrompt({
      cards: input.flashcards,
      repairFeedback: input.repairFeedback,
    }),
    config: {
      systemInstruction: ASSOCIATION_EXTRACTOR_SYSTEM_PROMPT,
      temperature: 0.2,
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  const jsonText = extractJsonArray(text);
  const data = JSON.parse(jsonText) as unknown;
  if (!Array.isArray(data)) return [];
  return data;
}

async function judgeAssociations(input: {
  flashcards: Array<{ id: number; question: string; answer: string }>;
  associations: AssociationRow[];
  rejected: RejectedRow[];
}): Promise<JudgeResult> {
  try {
    const response = await genAI.models.generateContent({
      model: JUDGE_MODEL_ID,
      contents: buildJudgePrompt(input),
      config: {
        systemInstruction: ASSOCIATION_JUDGE_SYSTEM_PROMPT,
        temperature: 0,
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    const jsonText = extractJsonObject(text);
    const parsed = judgeResultSchema.safeParse(JSON.parse(jsonText));
    if (!parsed.success) {
      return {
        verdict: input.associations.length > 0 ? "pass" : "fail",
        score: input.associations.length > 0 ? 70 : 0,
        feedback: "Judge output invalid; used fallback verdict.",
        critical_issues: [],
      };
    }

    return {
      verdict: parsed.data.verdict,
      score: parsed.data.score,
      feedback: parsed.data.feedback,
      critical_issues: parsed.data.critical_issues ?? [],
    };
  } catch {
    return {
      verdict: input.associations.length > 0 ? "pass" : "fail",
      score: input.associations.length > 0 ? 70 : 0,
      feedback: "Judge unavailable; used fallback verdict.",
      critical_issues: [],
    };
  }
}

function buildJudgePrompt(input: {
  flashcards: Array<{ id: number; question: string; answer: string }>;
  associations: AssociationRow[];
  rejected: RejectedRow[];
}) {
  return `Evaluate extracted associations for quality and grounding.

Flashcards:
${JSON.stringify(input.flashcards, null, 2)}

Candidate associations:
${JSON.stringify(
    input.associations.map((row) => ({
      id: row.id,
      question_key: row.question_key,
      answer_key: row.answer_key,
      link_verb: row.link_verb,
      confidence: row.confidence,
    })),
    null,
    2,
  )}

Rejected rows from deterministic validators:
${JSON.stringify(input.rejected, null, 2)}
`;
}

function normalizeAssociations(
  rawRows: unknown[],
  flashcards: Array<{ id: number; question: string; answer: string }>,
): { associations: AssociationRow[]; rejected: RejectedRow[] } {
  const flashcardMap = new Map(flashcards.map((card) => [card.id, card]));
  const associations: AssociationRow[] = [];
  const rejected: RejectedRow[] = [];

  for (const [index, row] of rawRows.entries()) {
    const parsedRow = rawAssociationSchema.safeParse(row);
    if (!parsedRow.success) continue;

    const rawId = parsedRow.data.id ?? flashcards[index]?.id ?? index + 1;
    const flashcard = flashcardMap.get(rawId);
    if (!flashcard) {
      rejected.push({ id: rawId, reason: "Unknown flashcard id" });
      continue;
    }

    const validated = validateAssociation({
      id: rawId,
      question: flashcard.question,
      answer: flashcard.answer,
      questionKey: parsedRow.data.question_key,
      answerKey: parsedRow.data.answer_key,
      linkVerb: parsedRow.data.link_verb ?? "relates to",
      reasoning: parsedRow.data.reasoning ?? "",
      confidence: parsedRow.data.confidence,
    });

    if (!validated.ok) {
      rejected.push({ id: rawId, reason: validated.reason });
      continue;
    }

    associations.push(validated.value);
  }

  const uniqueAssociations: AssociationRow[] = [];
  const seen = new Set<string>();
  for (const row of associations) {
    const key = `${row.question_key.toLowerCase()}|||${row.answer_key.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueAssociations.push(row);
  }

  return { associations: uniqueAssociations, rejected };
}

function buildRepairFeedback(input: {
  judge: JudgeResult;
  rejected: RejectedRow[];
}): string {
  const rejectedSummary = input.rejected
    .slice(0, 6)
    .map((row) => `- Card ${row.id}: ${row.reason}`)
    .join("\n");

  const issues = input.judge.critical_issues.length
    ? input.judge.critical_issues.map((issue) => `- ${issue}`).join("\n")
    : "- No critical issues listed.";

  return `Judge feedback:
${input.judge.feedback}

Critical issues:
${issues}

Deterministic validator failures:
${rejectedSummary || "- None"}`;
}

function chooseBestAttempt(attempts: AttemptSnapshot[]): AttemptSnapshot | null {
  if (attempts.length === 0) return null;
  return [...attempts].sort((left, right) => {
    if (right.judge.score !== left.judge.score) {
      return right.judge.score - left.judge.score;
    }
    return right.associations.length - left.associations.length;
  })[0]!;
}

function validateAssociation(input: {
  id: number;
  question: string;
  answer: string;
  questionKey: string;
  answerKey: string;
  linkVerb: string;
  reasoning: string;
  confidence: number | undefined;
}):
  | { ok: true; value: AssociationRow }
  | { ok: false; reason: string } {
  const questionKey = normalizeText(input.questionKey);
  const answerKey = normalizeText(input.answerKey);
  if (!questionKey || !answerKey) {
    return { ok: false, reason: "Missing question_key or answer_key" };
  }
  if (questionKey.toLowerCase() === answerKey.toLowerCase()) {
    return { ok: false, reason: "question_key and answer_key are identical" };
  }
  if (findCaseInsensitiveIndex(input.question, questionKey) === -1) {
    return { ok: false, reason: "question_key not found in question" };
  }
  if (findCaseInsensitiveIndex(input.answer, answerKey) === -1) {
    return { ok: false, reason: "answer_key not found in answer" };
  }

  return {
    ok: true,
    value: {
      id: input.id,
      question: input.question,
      answer: input.answer,
      question_key: questionKey,
      answer_key: answerKey,
      link_verb: normalizeText(input.linkVerb) || "relates to",
      reasoning: normalizeText(input.reasoning) || "Key exam association.",
      confidence: clampConfidence(input.confidence),
    },
  };
}
