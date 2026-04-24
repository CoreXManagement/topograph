import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import pool, { ensureSchema } from "@/lib/db";
import { DiagramCanvas } from "@/components/diagram/canvas";
import type { Edge } from "@xyflow/react";

interface DbNode {
  id: string;
  label: string;
  node_type: string;
  ip_address: string | null;
  port: string | null;
  description: string | null;
  custom_fields: unknown;
  position_x: number;
  position_y: number;
}

interface DbEdge {
  id: string;
  source_id: string;
  target_id: string;
  label: string | null;
  edge_type: string;
}

function edgeStyleProps(edgeType: string): Partial<Edge> {
  switch (edgeType) {
    case "dashed": return { style: { stroke: "#3b82f6", strokeDasharray: "8 4" }, animated: false };
    case "dotted": return { style: { stroke: "#8b5cf6", strokeDasharray: "2 5" }, animated: false };
    case "flow":   return { style: { stroke: "#22d3ee", strokeWidth: 2 }, animated: true };
    case "vpn":    return { style: { stroke: "#a855f7", strokeDasharray: "8 4", strokeWidth: 2 }, animated: true };
    default:       return { style: { stroke: "#52525b" }, animated: false };
  }
}

export default async function DiagramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await ensureSchema();

  const { rows: diagrams } = await pool.query<{ id: string; title: string; description: string | null }>(
    `SELECT id, title, description FROM docs_diagrams WHERE id = $1`, [id]
  );
  if (!diagrams[0]) notFound();
  const diagram = diagrams[0];

  const { rows: dbNodes } = await pool.query<DbNode>(
    `SELECT id, label, node_type, ip_address, port, description,
            COALESCE(custom_fields, '[]') AS custom_fields,
            position_x, position_y
     FROM docs_nodes WHERE diagram_id = $1 ORDER BY created_at`,
    [id]
  );

  const { rows: dbEdges } = await pool.query<DbEdge>(
    `SELECT id, source_id, target_id, label, edge_type FROM docs_edges WHERE diagram_id = $1`, [id]
  );

  const initialNodes = dbNodes.map((n) => ({
    id: n.id,
    type: n.node_type,
    position: { x: n.position_x, y: n.position_y },
    data: {
      label: n.label,
      nodeType: n.node_type,
      ipAddress: n.ip_address,
      port: n.port,
      description: n.description,
      customFields: Array.isArray(n.custom_fields) ? n.custom_fields : [],
    },
  }));

  const initialEdges: Edge[] = dbEdges.map((e) => ({
    id: e.id,
    source: e.source_id,
    target: e.target_id,
    label: e.label ?? undefined,
    labelStyle: e.label ? { fill: "#a1a1aa", fontSize: 11 } : undefined,
    labelBgStyle: e.label ? { fill: "#18181b", fillOpacity: 0.85 } : undefined,
    data: { edgeStyle: e.edge_type },
    ...edgeStyleProps(e.edge_type),
  }));

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="diagram-breadcrumb flex h-12 shrink-0 items-center gap-3 border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur" data-print="hide">
        <Link href="/diagrams" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" />
          Diagramme
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-xs font-medium text-zinc-200">{diagram.title}</span>
        {diagram.description && (
          <span className="hidden text-[10px] text-muted-foreground sm:block">— {diagram.description}</span>
        )}
      </div>

      <div className="flex-1 overflow-hidden diagram-canvas-wrapper">
        <DiagramCanvas
          diagramId={id}
          diagramTitle={diagram.title}
          initialNodes={initialNodes as Parameters<typeof DiagramCanvas>[0]["initialNodes"]}
          initialEdges={initialEdges}
        />
      </div>
    </div>
  );
}
