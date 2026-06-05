import { generateText } from "ai";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import db from "@/db";
import { artifacts, sources } from "@/db/schema";
import { inngest } from "../client";

const mindMapSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      parentId: z.string().nullable(),
    }),
  ),
  edges: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      label: z.string().optional(),
    }),
  ),
});

const flashcardSchema = z.object({
  cards: z
    .array(
      z.object({
        front: z.string(),
        back: z.string(),
      }),
    )
    .min(1)
    .max(20),
});

const quizSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).length(4),
        correctIndex: z.number().int().min(0).max(3),
        explanation: z.string().optional(),
      }),
    )
    .min(1)
    .max(15),
});

function buildMindMapPrompt(sourceContent: string, userPrompt: string): string {
  return `You are a mind map generator. Given the following source content and user instructions, generate a mind map as a JSON object.

The JSON must have this exact structure:
{
  "nodes": [
    { "id": "1", "label": "Central Topic", "parentId": null },
    { "id": "2", "label": "Subtopic 1", "parentId": "1" }
  ],
  "edges": [
    { "from": "1", "to": "2", "label": "" }
  ]
}

Requirements:
- The first node (parentId: null) is the root/central topic
- Each node needs id (string), label (short text), parentId (string or null)
- Each edge connects from one node to another with an optional label
- Generate 8-15 nodes covering the key concepts
- Labels should be concise (2-5 words)

Source content:
${sourceContent || "(No source content provided)"}

User instructions:
${userPrompt || "(No specific instructions)"}

Return ONLY valid JSON, no markdown formatting or code fences.`;
}

function buildFlashcardPrompt(
  sourceContent: string,
  userPrompt: string,
): string {
  return `You are a flashcard generator. Given the following source content and user instructions, generate flashcards as a JSON object.

The JSON must have this exact structure:
{
  "cards": [
    { "front": "Question or term", "back": "Answer or definition" },
    { "front": "Question or term", "back": "Answer or definition" }
  ]
}

Requirements:
- Generate 5-20 flashcards covering the key concepts from the source
- Front should be a concise question, term, or prompt
- Back should be a clear, complete answer or definition
- Use plain text only (no markdown, no formatting)
- Each card should test a single concept

Source content:
${sourceContent || "(No source content provided)"}

User instructions:
${userPrompt || "(No specific instructions)"}

Return ONLY valid JSON, no markdown formatting or code fences.`;
}

function buildQuizPrompt(sourceContent: string, userPrompt: string): string {
  return `You are a quiz generator. Given the following source content and user instructions, generate a multiple-choice quiz as a JSON object.

The JSON must have this exact structure:
{
  "questions": [
    {
      "question": "What is the capital of France?",
      "options": ["London", "Paris", "Berlin", "Madrid"],
      "correctIndex": 1,
      "explanation": "Paris has been the capital of France since..."
    }
  ]
}

Requirements:
- Generate 5-15 multiple-choice questions covering key concepts from the source
- Each question must have exactly 4 options
- correctIndex must be 0, 1, 2, or 3 (the index of the correct option)
- Questions can include markdown formatting (bold, lists, etc.)
- Include a brief explanation for the correct answer where helpful
- Questions should test understanding, not just recall

Source content:
${sourceContent || "(No source content provided)"}

User instructions:
${userPrompt || "(No specific instructions)"}

Return ONLY valid JSON, no markdown formatting or code fences.`;
}

function extractJSON(text: string): string {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : text;
}

export const generateArtifact = inngest.createFunction(
  { id: "generate-artifact", triggers: { event: "artifact/generate" } },
  async ({ event, step }) => {
    const { artifactId, sourceIds, prompt } = event.data;

    const artifact = await step.run("get-artifact", async () => {
      const [result] = await db
        .select()
        .from(artifacts)
        .where(eq(artifacts.id, artifactId as string))
        .limit(1);
      return result;
    });

    if (!artifact || artifact.status !== "generating") {
      return { skipped: true };
    }

    try {
      const contentSources = await step.run("get-sources", async () => {
        const ids = sourceIds as string[];
        if (!ids || ids.length === 0) return [];
        return db
          .select({ title: sources.title, rawContent: sources.rawContent })
          .from(sources)
          .where(inArray(sources.id, ids));
      });

      const sourceContent = contentSources
        .map((s) => (s.rawContent ? `[${s.title}]\n${s.rawContent}` : ""))
        .filter(Boolean)
        .join("\n\n---\n\n");

      if (artifact.type === "mindmap") {
        const result = await step.run("generate-mindmap", async () => {
          const response = await generateText({
            model: "openai/gpt-oss-20b",
            prompt: buildMindMapPrompt(sourceContent, (prompt as string) || ""),
          });
          return response.text;
        });

        const jsonStr = extractJSON(result);
        const parsed = mindMapSchema.parse(JSON.parse(jsonStr));

        await step.run("save-artifact", async () => {
          await db
            .update(artifacts)
            .set({
              content: parsed,
              status: "ready",
              updatedAt: new Date(),
            })
            .where(eq(artifacts.id, artifactId as string));
        });

        return { generated: true, nodeCount: parsed.nodes.length };
      }

      if (artifact.type === "flashcard") {
        const result = await step.run("generate-flashcards", async () => {
          const response = await generateText({
            model: "openai/gpt-oss-20b",
            prompt: buildFlashcardPrompt(
              sourceContent,
              (prompt as string) || "",
            ),
          });
          return response.text;
        });

        const jsonStr = extractJSON(result);
        const parsed = flashcardSchema.parse(JSON.parse(jsonStr));

        await step.run("save-flashcards", async () => {
          await db
            .update(artifacts)
            .set({
              content: parsed,
              status: "ready",
              updatedAt: new Date(),
            })
            .where(eq(artifacts.id, artifactId as string));
        });

        return { generated: true, cardCount: parsed.cards.length };
      }

      if (artifact.type === "quiz") {
        const result = await step.run("generate-quiz", async () => {
          const response = await generateText({
            model: "openai/gpt-oss-20b",
            prompt: buildQuizPrompt(sourceContent, (prompt as string) || ""),
          });
          return response.text;
        });

        const jsonStr = extractJSON(result);
        const parsed = quizSchema.parse(JSON.parse(jsonStr));

        await step.run("save-quiz", async () => {
          await db
            .update(artifacts)
            .set({
              content: parsed,
              status: "ready",
              updatedAt: new Date(),
            })
            .where(eq(artifacts.id, artifactId as string));
        });

        return { generated: true, questionCount: parsed.questions.length };
      }

      await step.run("mark-ready", async () => {
        await db
          .update(artifacts)
          .set({ status: "ready", updatedAt: new Date() })
          .where(eq(artifacts.id, artifactId as string));
      });
      return { unsupportedType: artifact.type };
    } catch (error) {
      await step.run("mark-failed", async () => {
        await db
          .update(artifacts)
          .set({ status: "failed", updatedAt: new Date() })
          .where(eq(artifacts.id, artifactId as string));
      });

      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
);
