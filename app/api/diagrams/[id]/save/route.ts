import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

interface SaveNode {
  id: string;
  label: string;
  nodeType: string;
  ipAddress: string | null;
  port: string | null;
  description: string | null;
  customFields: unknown[];
  positionX: number;
  positionY: number;
}

interface SaveEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label: string | null;
  edgeType: string;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { nodes, edges }: { nodes: SaveNode[]; edges: SaveEdge[] } = await req.json();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get current DB node IDs
    const { rows: existingNodes } = await client.query<{ id: string }>(
      `SELECT id FROM docs_nodes WHERE diagram_id = $1`,
      [id]
    );
    const existingIds = new Set(existingNodes.map((r) => r.id));
    const currentIds = new Set(nodes.map((n) => n.id));

    // Delete removed nodes (cascades to notes)
    for (const existId of existingIds) {
      if (!currentIds.has(existId)) {
        await client.query(`DELETE FROM docs_nodes WHERE id = $1`, [existId]);
      }
    }

    // Upsert current nodes
    for (const n of nodes) {
      if (existingIds.has(n.id)) {
        await client.query(
          `UPDATE docs_nodes SET label=$1, node_type=$2, ip_address=$3, port=$4, description=$5,
           custom_fields=$6, position_x=$7, position_y=$8, updated_at=NOW() WHERE id=$9 AND diagram_id=$10`,
          [n.label, n.nodeType, n.ipAddress, n.port, n.description,
           JSON.stringify(n.customFields ?? []), n.positionX, n.positionY, n.id, id]
        );
      } else {
        await client.query(
          `INSERT INTO docs_nodes (id, diagram_id, label, node_type, ip_address, port, description, custom_fields, position_x, position_y)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [n.id, id, n.label, n.nodeType, n.ipAddress, n.port, n.description,
           JSON.stringify(n.customFields ?? []), n.positionX, n.positionY]
        );
      }
    }

    // Replace edges
    await client.query(`DELETE FROM docs_edges WHERE diagram_id = $1`, [id]);
    for (const e of edges) {
      await client.query(
        `INSERT INTO docs_edges (id, diagram_id, source_id, target_id, label, edge_type)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [e.id, id, e.sourceId, e.targetId, e.label, e.edgeType ?? "solid"]
      );
    }

    // Update diagram timestamp
    await client.query(`UPDATE docs_diagrams SET updated_at = NOW() WHERE id = $1`, [id]);

    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("save error", err);
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  } finally {
    client.release();
  }
}
