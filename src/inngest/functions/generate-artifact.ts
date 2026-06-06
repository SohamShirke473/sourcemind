import { GoogleGenAI } from "@google/genai";
import { generateText } from "ai";
import { eq, inArray } from "drizzle-orm";
import { WaveFile } from "wavefile";
import { z } from "zod";
import db from "@/db";
import { artifacts, sources } from "@/db/schema";
import { uploadFile } from "@/lib/r2";
import { inngest } from "../client";

const mindMapSchema = z.object({
  title: z.string(),
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
  title: z.string(),
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
  title: z.string(),
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

const reportSchema = z.object({
  title: z.string(),
  report: z.string(),
});

function buildMindMapPrompt(sourceContent: string, userPrompt: string): string {
  return `You are a mind map generator. Given the following source content and user instructions, generate a mind map as a JSON object.

The JSON must have this exact structure:
{
  "title": "Descriptive title here",
  "nodes": [
    { "id": "1", "label": "Central Topic", "parentId": null },
    { "id": "2", "label": "Subtopic 1", "parentId": "1" }
  ],
  "edges": [
    { "from": "1", "to": "2", "label": "" }
  ]
}

Requirements:
- title: A concise, descriptive title for the mind map (max 6 words)
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
  "title": "Descriptive title here",
  "cards": [
    { "front": "Question or term", "back": "Answer or definition" },
    { "front": "Question or term", "back": "Answer or definition" }
  ]
}

Requirements:
- title: A concise, descriptive title for the flashcards (max 6 words)
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
  "title": "Descriptive title here",
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
- title: A concise, descriptive title for the quiz (max 6 words)
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

function buildReportPrompt(sourceContent: string, userPrompt: string): string {
  return `You are a professional report writer. Given the following source content and user instructions, generate a comprehensive report as a JSON object.

The JSON must have this exact structure:
{
  "title": "Descriptive title here",
  "report": "Your detailed report content formatted in Markdown"
}

Requirements:
- title: A concise, descriptive title for the report (max 6 words)
- Generate a well-structured report covering the key concepts from the source
- Use Markdown formatting (headings, bullet points, bold text)
- Include an introduction, body paragraphs with subheadings, and a conclusion
- The report should be informative and synthesize the source material
- Use plain text for the JSON values (escape necessary characters, but no code fences inside the string)

Source content:
${sourceContent || "(No source content provided)"}

User instructions:
${userPrompt || "(No specific instructions)"}

Return ONLY valid JSON, no markdown formatting or code fences outside the JSON string.`;
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
            model: "minimax/minimax-m2.5",
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
              title: parsed.title,
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
            model: "minimax/minimax-m2.5",
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
              title: parsed.title,
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
            model: "minimax/minimax-m2.5",
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
              title: parsed.title,
              status: "ready",
              updatedAt: new Date(),
            })
            .where(eq(artifacts.id, artifactId as string));
        });

        return { generated: true, questionCount: parsed.questions.length };
      }

      if (artifact.type === "report") {
        const result = await step.run("generate-report", async () => {
          const response = await generateText({
            model: "minimax/minimax-m2.5",
            prompt: buildReportPrompt(sourceContent, (prompt as string) || ""),
          });
          return response.text;
        });

        const jsonStr = extractJSON(result);
        const parsed = reportSchema.parse(JSON.parse(jsonStr));

        await step.run("save-report", async () => {
          await db
            .update(artifacts)
            .set({
              content: parsed,
              title: parsed.title,
              status: "ready",
              updatedAt: new Date(),
            })
            .where(eq(artifacts.id, artifactId as string));
        });

        return { generated: true };
      }

      if (artifact.type === "audio") {
        const result = await step.run("generate-audio", async () => {
          const transcriptResponse = await generateText({
            model: "minimax/minimax-m2.5",
            prompt: `You are a podcast generator. Given the following source content and user instructions, generate a short podcast transcript (around 200 words) summarizing the key concepts.
The podcast is hosted by two hosts: "Host 1" and "Host 2". Make it conversational and engaging.

Source content:
${sourceContent || "(No source content provided)"}

User instructions:
${(prompt as string) || "(No specific instructions)"}

Return the transcript in a plain text format, for example:
Host 1: Hello!
Host 2: Hi there!
Do not use markdown formatting.`,
          });

          const titleResponse = await generateText({
            model: "minimax/minimax-m2.5",
            prompt: `Generate a short (max 6 words), catchy title for a podcast episode based on this transcript:\n\n${transcriptResponse.text}`,
          });
          const generatedTitle = titleResponse.text.replace(/["*]/g, "").trim();

          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          
          const audioResponse = await ai.models.generateContent({
             model: "gemini-3.1-flash-tts-preview",
             contents: [{ parts: [{ text: `TTS the following conversation between Host 1 and Host 2:\n${transcriptResponse.text}` }] }],
             config: {
                   responseModalities: ['AUDIO'],
                   speechConfig: {
                      multiSpeakerVoiceConfig: {
                         speakerVoiceConfigs: [
                               {
                                  speaker: 'Host 1',
                                  voiceConfig: {
                                     prebuiltVoiceConfig: { voiceName: 'Kore' }
                                  }
                               },
                               {
                                  speaker: 'Host 2',
                                  voiceConfig: {
                                     prebuiltVoiceConfig: { voiceName: 'Puck' }
                                  }
                               }
                         ]
                      }
                   }
             }
          });

          const base64Data = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (!base64Data) throw new Error("No audio data returned from Gemini TTS");

          const pcmBuffer = Buffer.from(base64Data, 'base64');
          
          // Generate a standard 44-byte WAV header for 24kHz 16-bit mono PCM
          const wavHeader = Buffer.alloc(44);
          wavHeader.write("RIFF", 0);
          wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
          wavHeader.write("WAVE", 8);
          wavHeader.write("fmt ", 12);
          wavHeader.writeUInt32LE(16, 16); // Subchunk1Size
          wavHeader.writeUInt16LE(1, 20); // AudioFormat (PCM)
          wavHeader.writeUInt16LE(1, 22); // NumChannels
          wavHeader.writeUInt32LE(24000, 24); // SampleRate
          wavHeader.writeUInt32LE(24000 * 2, 28); // ByteRate
          wavHeader.writeUInt16LE(2, 32); // BlockAlign
          wavHeader.writeUInt16LE(16, 34); // BitsPerSample
          wavHeader.write("data", 36);
          wavHeader.writeUInt32LE(pcmBuffer.length, 40);

          const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);
          
          const fileKey = `artifacts/audio/${artifactId}.wav`;
          await uploadFile({
            buffer: Buffer.from(wavBuffer),
            key: fileKey,
            contentType: "audio/wav",
          });

          await db
            .update(artifacts)
            .set({
              fileUrl: fileKey,
              title: generatedTitle,
              status: "ready",
              updatedAt: new Date(),
            })
            .where(eq(artifacts.id, artifactId as string));
            
          return { generated: true, title: generatedTitle };
        });

        return result;
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
