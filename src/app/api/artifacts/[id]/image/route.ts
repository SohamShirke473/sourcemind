import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { artifacts, workspaces } from "@/db/schema";
import { getSignedFileUrl } from "@/lib/r2";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  
  const { userId } = await auth();
  if (!userId) {
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

  if (!workspace || workspace.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!artifact.fileUrl) {
    return NextResponse.json({ error: "No image file found" }, { status: 404 });
  }

  const download = _request.nextUrl.searchParams.get("download") === "true";
  const filename = download ? `${artifact.title.toLowerCase().replace(/\s+/g, "-")}.png` : undefined;

  try {
    const url = await getSignedFileUrl(artifact.fileUrl, filename);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
  }
}
