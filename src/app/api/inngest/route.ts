import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processSource, processTask } from "@/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processTask, processSource],
});
