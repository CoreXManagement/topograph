import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

// Immediately persist a new node so FK constraints on notes don't fail
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: diagramId } = await params;

  const { nodeId, label, nodeType, positionX, positionY } = await req.json();

  await pool.query(
    `INSERT INTO docs_nodes (id, diagram_id, label, node_type, position_x, position_y, custom_fields)
     VALUES ($1, $2, $3, $4, $5, $6, '[]')
     ON CONFLICT (id) DO NOTHING`,
    [nodeId, diagramId, label, nodeType, positionX ?? 0, positionY ?? 0]
  );

  return NextResponse.json({ id: nodeId }, { status: 201 });
}
