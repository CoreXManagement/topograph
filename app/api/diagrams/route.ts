import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool, { ensureSchema } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureSchema();
  const { rows } = await pool.query(
    `SELECT d.id, d.title, d.description, d.created_at, d.updated_at,
            COUNT(n.id)::int AS node_count
     FROM docs_diagrams d
     LEFT JOIN docs_nodes n ON n.diagram_id = d.id
     GROUP BY d.id
     ORDER BY d.updated_at DESC`
  );
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureSchema();
  const { title, description } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });

  const userId = (session.user as { id?: string }).id ?? null;
  const { rows } = await pool.query(
    `INSERT INTO docs_diagrams (title, description, created_by)
     VALUES ($1, $2, $3)
     RETURNING id, title, description, created_at`,
    [title.trim(), description ?? null, userId]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
