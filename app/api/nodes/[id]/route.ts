import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { label, nodeType, ipAddress, port, description, customFields } = await req.json();

  const { rows } = await pool.query(
    `UPDATE docs_nodes
     SET label=$1, node_type=$2, ip_address=$3, port=$4, description=$5,
         custom_fields=$6, updated_at=NOW()
     WHERE id=$7 RETURNING id`,
    [label, nodeType, ipAddress ?? null, port ?? null, description ?? null,
     JSON.stringify(customFields ?? []), id]
  );
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await pool.query(`DELETE FROM docs_nodes WHERE id = $1`, [id]);
  return new NextResponse(null, { status: 204 });
}
