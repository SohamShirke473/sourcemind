import { baseProcedure, createTRPCRouter } from "../init";
import { workspaceRouter } from "./workspace";

export const appRouter = createTRPCRouter({
  hello: baseProcedure.query(() => {
    return { greeting: "hello world" };
  }),
  workspace: workspaceRouter,
});

export type AppRouter = typeof appRouter;
