"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type EdgeMouseHandler,
  type Connection,
  type Viewport,
  type ReactFlowInstance,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Save, ChevronDown, Check, Trash2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { NODE_TYPES, NODE_TYPE_OPTIONS, type NodeType, type NodeData } from "./node-types";
import { NodePanel } from "./node-panel";
import { PdfExportDialog } from "./pdf-export-dialog";

type DiagramNode = Node<NodeData>;
type EdgeStyle   = "solid" | "dashed" | "dotted" | "flow" | "vpn";

const EDGE_STYLES: { value: EdgeStyle; label: string }[] = [
  { value: "solid",  label: "Normal" },
  { value: "dashed", label: "Gestrichelt" },
  { value: "dotted", label: "Gepunktet" },
  { value: "flow",   label: "Datenfluss ▶ animiert" },
  { value: "vpn",    label: "VPN ▶ animiert" },
];

function edgeStyleProps(style: EdgeStyle): Partial<Edge> {
  switch (style) {
    case "dashed": return { style: { stroke: "#3b82f6", strokeDasharray: "8 4" }, animated: false };
    case "dotted": return { style: { stroke: "#8b5cf6", strokeDasharray: "2 5" }, animated: false };
    case "flow":   return { style: { stroke: "#22d3ee", strokeWidth: 2 }, animated: true };
    case "vpn":    return { style: { stroke: "#a855f7", strokeDasharray: "8 4", strokeWidth: 2 }, animated: true };
    default:       return { style: { stroke: "#52525b" }, animated: false };
  }
}

const NODE_MINIMAP_COLOR: Partial<Record<NodeType, string>> = {
  SERVICE: "#22d3ee", DATABASE: "#f59e0b", APP: "#3b82f6",
  EXTERNAL: "#a855f7", SERVER: "#22c55e", QUEUE: "#f97316",
  NETWORK: "#a1a1aa", STORAGE: "#f43f5e", MAIL: "#0ea5e9",
  CLOUD: "#6366f1", CONTAINER: "#14b8a6", MONITOR: "#ef4444",
  START: "#10b981", END: "#ef4444",
};

let nodeCounter = 0;

interface Props {
  diagramId: string;
  diagramTitle: string;
  initialNodes: DiagramNode[];
  initialEdges: Edge[];
}

export function DiagramCanvas({ diagramId, diagramTitle, initialNodes, initialEdges }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<DiagramNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [edgeStyle, setEdgeStyle]           = useState<EdgeStyle>("solid");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saveState, setSaveState]           = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pdfOpen, setPdfOpen]               = useState(false);
  const [rfInstance, setRfInstance]         = useState<ReactFlowInstance | null>(null);
  const [edgeLabelEdit, setEdgeLabelEdit]   = useState<{ id: string; label: string } | null>(null);
  const viewportRef  = useRef<Viewport>({ x: 0, y: 0, zoom: 1 });
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // ── Ctrl+S ────────────────────────────────────────────────────────────────
  const saveRef = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveRef.current?.();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── Connect ───────────────────────────────────────────────────────────────
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id: crypto.randomUUID(),
            ...edgeStyleProps(edgeStyle),
            data: { edgeStyle },
            markerEnd: edgeStyle === "flow" || edgeStyle === "vpn"
              ? { type: MarkerType.ArrowClosed, color: edgeStyle === "flow" ? "#22d3ee" : "#a855f7" }
              : { type: MarkerType.ArrowClosed, color: "#52525b" },
          },
          eds
        )
      );
    },
    [edgeStyle, setEdges]
  );

  // ── Add node ──────────────────────────────────────────────────────────────
  const addNode = useCallback(
    (type: NodeType) => {
      const id    = crypto.randomUUID();
      nodeCounter++;
      const opt   = NODE_TYPE_OPTIONS.find((o) => o.value === type);
      const label = type === "START" ? "Start" : type === "END" ? "Ende" : `${opt?.label ?? type} ${nodeCounter}`;
      const position = {
        x: (-viewportRef.current.x + 400) / viewportRef.current.zoom,
        y: (-viewportRef.current.y + 300) / viewportRef.current.zoom,
      };
      const newNode: DiagramNode = {
        id, type, position,
        data: { label, nodeType: type, ipAddress: null, port: null, description: null, customFields: [] },
      };
      setNodes((nds) => [...nds, newNode]);
      fetch(`/api/diagrams/${diagramId}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: id, label, nodeType: type, positionX: position.x, positionY: position.y }),
      }).catch(() => {});
    },
    [diagramId, setNodes]
  );

  // ── Duplicate node ────────────────────────────────────────────────────────
  const handleNodeDuplicate = useCallback(
    (nodeId: string) => {
      const src = nodes.find((n) => n.id === nodeId);
      if (!src) return;
      const id    = crypto.randomUUID();
      const label = `${src.data.label} (Kopie)`;
      const position = { x: src.position.x + 40, y: src.position.y + 40 };
      const newNode: DiagramNode = {
        ...src,
        id,
        position,
        data: { ...src.data, label, customFields: (src.data.customFields ?? []).map((f) => ({ ...f, id: crypto.randomUUID() })) },
      };
      setNodes((nds) => [...nds, newNode]);
      fetch(`/api/diagrams/${diagramId}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: id, label, nodeType: src.data.nodeType, positionX: position.x, positionY: position.y }),
      }).catch(() => {});
    },
    [nodes, diagramId, setNodes]
  );

  // ── Update / delete node ──────────────────────────────────────────────────
  const handleNodeUpdate = useCallback(
    (nodeId: string, updates: Partial<NodeData>) => {
      setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n));
    },
    [setNodes]
  );

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      fetch(`/api/nodes/${nodeId}`, { method: "DELETE" });
    },
    [setNodes, setEdges]
  );

  const deleteSelectedEdges = useCallback(() => {
    setEdges((eds) => eds.filter((e) => !e.selected));
  }, [setEdges]);

  // ── Edge double-click → label editor ─────────────────────────────────────
  const onEdgeDoubleClick: EdgeMouseHandler = useCallback((_e, edge) => {
    setEdgeLabelEdit({ id: edge.id, label: (edge.label as string) ?? "" });
  }, []);

  function applyEdgeLabel() {
    if (!edgeLabelEdit) return;
    const labelVal = edgeLabelEdit.label.trim() || undefined;
    setEdges((eds) =>
      eds.map((e) =>
        e.id === edgeLabelEdit.id
          ? { ...e, label: labelVal, labelStyle: { fill: "#a1a1aa", fontSize: 11 }, labelBgStyle: { fill: "#18181b", fillOpacity: 0.85 } }
          : e
      )
    );
    setEdgeLabelEdit(null);
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function save() {
    setSaveState("saving");
    try {
      const res = await fetch(`/api/diagrams/${diagramId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodes: nodes.map((n) => ({
            id: n.id, label: n.data.label, nodeType: n.data.nodeType,
            ipAddress: n.data.ipAddress ?? null, port: n.data.port ?? null,
            description: n.data.description ?? null, customFields: n.data.customFields ?? [],
            positionX: n.position.x, positionY: n.position.y,
          })),
          edges: edges.map((e) => ({
            id: e.id, sourceId: e.source, targetId: e.target,
            label: (e.label as string) ?? null,
            edgeType: (e.data as { edgeStyle?: string })?.edgeStyle ?? "solid",
          })),
          viewport: viewportRef.current,
        }),
      });
      if (!res.ok) throw new Error();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }

  // Keep save ref up-to-date for the Ctrl+S handler
  saveRef.current = save;

  const hasSelectedEdges = edges.some((e) => e.selected);
  const nodeGroups = ["Workflow", "Software", "Infrastruktur", "Dienste"] as const;

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="diagram-toolbar flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-950/90 px-4 py-2 backdrop-blur" data-print="hide">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="h-4 w-4" />Node<ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-[400px] overflow-y-auto">
            {nodeGroups.map((group) => {
              const opts = NODE_TYPE_OPTIONS.filter((o) => o.group === group);
              return (
                <div key={group}>
                  <DropdownMenuLabel>{group}</DropdownMenuLabel>
                  {opts.map((o) => (
                    <DropdownMenuItem key={o.value} onSelect={() => addNode(o.value)}>{o.label}</DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </div>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              Linie: {EDGE_STYLES.find((s) => s.value === edgeStyle)?.label}<ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {EDGE_STYLES.map((s) => (
              <DropdownMenuItem key={s.value} onSelect={() => setEdgeStyle(s.value)}>
                {s.label}{edgeStyle === s.value && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasSelectedEdges && (
          <Button size="sm" variant="ghost" className="gap-1 text-destructive hover:text-destructive" onClick={deleteSelectedEdges}>
            <Trash2 className="h-4 w-4" />Verbindung löschen
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setPdfOpen(true)} className="gap-1 text-muted-foreground hover:text-foreground">
            <FileDown className="h-4 w-4" />PDF
          </Button>
          {saveState === "saved"  && <Badge variant="green" className="gap-1"><Check className="h-3 w-3" />Gespeichert</Badge>}
          {saveState === "error"  && <Badge variant="destructive">Fehler</Badge>}
          <Button size="sm" onClick={save} disabled={saveState === "saving"} className="gap-1">
            <Save className="h-4 w-4" />
            {saveState === "saving" ? "Speichere..." : "Speichern"}
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="diagram-canvas flex-1" ref={containerRef}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange as Parameters<typeof ReactFlow>[0]["onNodesChange"]}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={NODE_TYPES}
          onInit={setRfInstance}
          onMoveEnd={(_e, vp) => { viewportRef.current = vp; }}
          onEdgeDoubleClick={onEdgeDoubleClick}
          fitView
          deleteKeyCode="Delete"
          onNodeClick={(_e, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          proOptions={{ hideAttribution: true }}
          style={{ height: "100%" }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#27272a" />
          <Controls />
          <MiniMap
            className="!bottom-4 !right-4"
            nodeColor={(n) => NODE_MINIMAP_COLOR[(n as DiagramNode).data?.nodeType] ?? "#52525b"}
            maskColor="rgba(0,0,0,0.7)"
          />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="diagram-legend flex flex-wrap items-center gap-4 border-t border-zinc-800 bg-zinc-950/80 px-4 py-2 text-[10px] text-muted-foreground" data-print="hide">
        <span>Klick = Details · Handles ziehen = Verbindung · Doppelklick auf Linie = Label · Entf = löschen · <kbd className="rounded border border-zinc-700 px-1">Ctrl+S</kbd> = speichern</span>
        <span className="ml-auto flex items-center gap-4">
          <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-cyan-400" />Datenfluss</span>
          <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-purple-500" />VPN</span>
        </span>
      </div>

      {/* Node detail panel */}
      {selectedNode && (
        <NodePanel
          nodeId={selectedNode.id}
          data={selectedNode.data}
          onClose={() => setSelectedNodeId(null)}
          onUpdate={handleNodeUpdate}
          onDelete={handleNodeDelete}
          onDuplicate={handleNodeDuplicate}
        />
      )}

      {/* Edge label editor */}
      <Dialog open={!!edgeLabelEdit} onOpenChange={(o) => !o && setEdgeLabelEdit(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>Verbindungs-Label</DialogTitle></DialogHeader>
          <Input
            autoFocus
            value={edgeLabelEdit?.label ?? ""}
            onChange={(e) => setEdgeLabelEdit((v) => v ? { ...v, label: e.target.value } : v)}
            onKeyDown={(e) => { if (e.key === "Enter") applyEdgeLabel(); }}
            placeholder="z.B. HTTP · TCP 443 · VPN"
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEdgeLabelEdit(null)}>Abbrechen</Button>
            <Button size="sm" onClick={applyEdgeLabel}>Übernehmen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF export */}
      <PdfExportDialog
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        diagramTitle={diagramTitle}
        rfInstance={rfInstance}
        containerRef={containerRef}
      />
    </div>
  );
}
