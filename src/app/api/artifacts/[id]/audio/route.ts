import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { artifacts, workspaces } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getSignedFileUrl } from "@/lib/r2";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [artifact] = await db
    .select()
    .from(artifacts)
    .where(eq(artifacts.id, id))
    .limit(1);

  if (!artifact) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, artifact.workspaceId))
    .limit(1);

  if (!workspace || workspace.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!artifact.fileUrl) {
    return NextResponse.json({ error: "No audio file found" }, { status: 404 });
  }

  try {
    const url = await getSignedFileUrl(artifact.fileUrl);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 500 },
    );
  }
}
