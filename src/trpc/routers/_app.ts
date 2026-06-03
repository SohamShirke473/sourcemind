import { baseProcedure, createTRPCRouter } from "../init";
import { chatRouter } from "./chat";
import { sourceRouter } from "./source";
import { workspaceRouter } from "./workspace";

export const appRouter = createTRPCRouter({
  hello: baseProcedure.query(() => {
    return { greeting: "hello world" };
  }),
  workspace: workspaceRouter,
  source: sourceRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
