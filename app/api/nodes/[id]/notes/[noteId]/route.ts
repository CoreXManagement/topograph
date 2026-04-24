import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, noteId } = await params;

  await pool.query(`DELETE FROM docs_node_notes WHERE id = $1 AND node_id = $2`, [noteId, id]);
  return new NextResponse(null, { status: 204 });
}
