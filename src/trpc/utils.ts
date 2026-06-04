import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import db from "@/db";
import { workspaces } from "@/db/schema";

export async function assertWorkspaceOwnership(
  workspaceId: string,
  userId: string,
) {
  const [workspace] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)))
    .limit(1);
  if (!workspace) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
}
