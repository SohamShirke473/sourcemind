import { serve } from "inngest/next";
import { generateArtifact, processSource } from "@/inngest";
import { inngest } from "@/inngest/client";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processSource, generateArtifact],
});
