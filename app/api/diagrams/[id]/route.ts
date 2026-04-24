import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { rows } = await pool.query(
    `SELECT id, title, description, created_at, updated_at FROM docs_diagrams WHERE id = $1`,
    [id]
  );
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { title, description } = await req.json();

  const { rows } = await pool.query(
    `UPDATE docs_diagrams SET title = COALESCE($1, title), description = $2, updated_at = NOW()
     WHERE id = $3 RETURNING id, title, description, updated_at`,
    [title?.trim() ?? null, description ?? null, id]
  );
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await pool.query(`DELETE FROM docs_diagrams WHERE id = $1`, [id]);
  return new NextResponse(null, { status: 204 });
}
