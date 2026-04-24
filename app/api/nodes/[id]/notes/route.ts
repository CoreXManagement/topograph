import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { rows } = await pool.query(
    `SELECT id, content, created_by, created_at FROM docs_node_notes WHERE node_id = $1 ORDER BY created_at DESC`,
    [id]
  );
  return NextResponse.json(rows);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });

  const authorName = session.user?.name ?? session.user?.email ?? null;
  const { rows } = await pool.query(
    `INSERT INTO docs_node_notes (node_id, content, created_by) VALUES ($1, $2, $3) RETURNING id, content, created_by, created_at`,
    [id, content.trim(), authorName]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
