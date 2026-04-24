"use client";
import { useEffect, useRef } from "react";
import { Copy, Trash2, Plus, Unlink, ArrowRight, X, ZoomIn, Maximize2 } from "lucide-react";
import { NODE_TYPE_OPTIONS, type NodeType } from "./node-types";

export interface ContextMenuState {
  type: "pane" | "node" | "edge";
  x: number;
  y: number;
  nodeId?: string;
  edgeId?: string;
  nodeLabel?: string;
}

interface Props {
  menu: ContextMenuState;
  onClose: () => void;
  onAddNode: (type: NodeType, x: number, y: number) => void;
  onDeleteNode: (id: string) => void;
  onDuplicateNode: (id: string) => void;
  onDeleteEdge: (id: string) => void;
  onFitView: () => void;
}

const DIVIDER = "divider";

export function ContextMenu({ menu, onClose, onAddNode, onDeleteNode, onDuplicateNode, onDeleteEdge, onFitView }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", esc); };
  }, [onClose]);

  // Prevent menu from going off screen
  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.min(menu.x, window.innerWidth - 220),
    top: Math.min(menu.y, window.innerHeight - 400),
    zIndex: 9999,
  };

  const item = (icon: React.ReactNode, label: string, action: () => void, danger = false) => (
    <button
      key={label}
      onClick={() => { action(); onClose(); }}
      className={`flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-left text-xs transition-colors ${
        danger ? "text-red-400 hover:bg-red-500/10" : "text-zinc-300 hover:bg-zinc-700/60 hover:text-zinc-100"
      }`}
    >
      <span className="h-3.5 w-3.5 shrink-0">{icon}</span>
      {label}
    </button>
  );

  const paneItems = [
    item(<Plus className="h-3.5 w-3.5 text-cyan-400" />, "Node hinzufügen →", () => {}),
    DIVIDER,
    item(<Maximize2 className="h-3.5 w-3.5" />, "Alles einpassen", onFitView),
  ];

  const addSubmenu = (
    <div className="space-y-0.5">
      <p className="px-3 pb-1 pt-0.5 text-[9px] uppercase tracking-wider text-zinc-600">Node-Typ wählen</p>
      {NODE_TYPE_OPTIONS.slice(0, 6).map((o) => (
        <button
          key={o.value}
          onClick={() => { onAddNode(o.value, menu.x, menu.y); onClose(); }}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-700/60 hover:text-zinc-100 transition-colors"
        >
          {o.label}
        </button>
      ))}
      <div className="my-1 border-t border-zinc-700/60" />
      {NODE_TYPE_OPTIONS.slice(6).map((o) => (
        <button
          key={o.value}
          onClick={() => { onAddNode(o.value, menu.x, menu.y); onClose(); }}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-700/60 hover:text-zinc-100 transition-colors"
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  const nodeItems = [
    item(<ZoomIn className="h-3.5 w-3.5" />, `Details: ${menu.nodeLabel ?? "Node"}`, () => {}),
    DIVIDER,
    item(<Copy className="h-3.5 w-3.5" />, "Duplizieren", () => menu.nodeId && onDuplicateNode(menu.nodeId)),
    DIVIDER,
    item(<Trash2 className="h-3.5 w-3.5" />, "Node löschen", () => menu.nodeId && onDeleteNode(menu.nodeId), true),
  ];

  const edgeItems = [
    item(<Unlink className="h-3.5 w-3.5" />, "Verbindung löschen", () => menu.edgeId && onDeleteEdge(menu.edgeId), true),
  ];

  return (
    <div
      ref={ref}
      style={style}
      className="min-w-[192px] rounded-xl border border-zinc-700/60 bg-zinc-900/95 p-1 shadow-2xl shadow-black/60 backdrop-blur-xl"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800/60 mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          {menu.type === "pane" ? "Canvas" : menu.type === "node" ? "Node" : "Verbindung"}
        </span>
        <button onClick={onClose} className="text-zinc-700 hover:text-zinc-400"><X className="h-3 w-3" /></button>
      </div>

      <div className="space-y-0.5">
        {menu.type === "pane" && (
          <>
            {item(<Maximize2 className="h-3.5 w-3.5" />, "Alles einpassen", onFitView)}
            <div className="my-1 border-t border-zinc-800/60" />
            <p className="px-3 pb-1 text-[9px] uppercase tracking-wider text-zinc-600">Node hinzufügen</p>
            {addSubmenu}
          </>
        )}
        {menu.type === "node" && (
          <>
            {item(<Copy className="h-3.5 w-3.5" />, "Duplizieren", () => menu.nodeId && onDuplicateNode(menu.nodeId))}
            <div className="my-1 border-t border-zinc-800/60" />
            {item(<Trash2 className="h-3.5 w-3.5" />, "Node löschen", () => menu.nodeId && onDeleteNode(menu.nodeId), true)}
          </>
        )}
        {menu.type === "edge" && (
          item(<Unlink className="h-3.5 w-3.5" />, "Verbindung löschen", () => menu.edgeId && onDeleteEdge(menu.edgeId), true)
        )}
      </div>
    </div>
  );
}
