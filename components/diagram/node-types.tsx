"use client";
import React from "react";
import { Handle, Position, type NodeProps, type NodeTypes } from "@xyflow/react";
import {
  Server, Database, Globe, Cpu, Layers, Mail, HardDrive,
  Network, Cloud, Box, Zap, Monitor, Play, Square,
} from "lucide-react";

export type NodeType =
  | "SERVICE" | "DATABASE" | "APP" | "EXTERNAL" | "SERVER"
  | "QUEUE" | "NETWORK" | "STORAGE" | "MAIL" | "CLOUD" | "CONTAINER" | "MONITOR"
  | "START" | "END";

export interface CustomField {
  id: string;
  key: string;
  value: string;
  visible: boolean;
}

export interface NodeData extends Record<string, unknown> {
  label: string;
  nodeType: NodeType;
  ipAddress?: string | null;
  port?: string | null;
  description?: string | null;
  customFields?: CustomField[];
}

const NODE_CONFIG: Record<NodeType, {
  icon: React.ComponentType<{ className?: string }>;
  color: string; ring: string; bg: string; label: string;
}> = {
  SERVICE:   { icon: Layers,    color: "text-cyan-400",   ring: "ring-cyan-500/30",   bg: "from-cyan-950/60",    label: "Service" },
  DATABASE:  { icon: Database,  color: "text-amber-400",  ring: "ring-amber-500/30",  bg: "from-amber-950/60",   label: "Datenbank" },
  APP:       { icon: Monitor,   color: "text-blue-400",   ring: "ring-blue-500/30",   bg: "from-blue-950/60",    label: "App" },
  EXTERNAL:  { icon: Globe,     color: "text-purple-400", ring: "ring-purple-500/30", bg: "from-purple-950/60",  label: "Extern" },
  SERVER:    { icon: Server,    color: "text-green-400",  ring: "ring-green-500/30",  bg: "from-green-950/60",   label: "Server" },
  QUEUE:     { icon: Zap,       color: "text-orange-400", ring: "ring-orange-500/30", bg: "from-orange-950/60",  label: "Queue" },
  NETWORK:   { icon: Network,   color: "text-zinc-300",   ring: "ring-zinc-500/30",   bg: "from-zinc-800/60",    label: "Netzwerk" },
  STORAGE:   { icon: HardDrive, color: "text-rose-400",   ring: "ring-rose-500/30",   bg: "from-rose-950/60",    label: "Storage" },
  MAIL:      { icon: Mail,      color: "text-sky-400",    ring: "ring-sky-500/30",    bg: "from-sky-950/60",     label: "Mail" },
  CLOUD:     { icon: Cloud,     color: "text-indigo-400", ring: "ring-indigo-500/30", bg: "from-indigo-950/60",  label: "Cloud" },
  CONTAINER: { icon: Box,       color: "text-teal-400",   ring: "ring-teal-500/30",   bg: "from-teal-950/60",    label: "Container" },
  MONITOR:   { icon: Cpu,       color: "text-red-400",    ring: "ring-red-500/30",    bg: "from-red-950/60",     label: "Monitor" },
  START:     { icon: Play,      color: "text-emerald-400",ring: "ring-emerald-500/50",bg: "from-emerald-950/60", label: "Start" },
  END:       { icon: Square,    color: "text-red-400",    ring: "ring-red-500/50",    bg: "from-red-950/60",     label: "Ende" },
};

export const NODE_TYPE_OPTIONS: { value: NodeType; label: string; group: string }[] = [
  { value: "START",     label: "▶ Start",       group: "Workflow" },
  { value: "END",       label: "■ Ende",         group: "Workflow" },
  { value: "SERVICE",   label: "Service",        group: "Software" },
  { value: "DATABASE",  label: "Datenbank",      group: "Software" },
  { value: "APP",       label: "App",            group: "Software" },
  { value: "QUEUE",     label: "Queue",          group: "Software" },
  { value: "EXTERNAL",  label: "Extern",         group: "Software" },
  { value: "SERVER",    label: "Server",         group: "Infrastruktur" },
  { value: "STORAGE",   label: "Storage",        group: "Infrastruktur" },
  { value: "NETWORK",   label: "Netzwerk",       group: "Infrastruktur" },
  { value: "CONTAINER", label: "Rack/Container", group: "Infrastruktur" },
  { value: "CLOUD",     label: "Cloud",          group: "Infrastruktur" },
  { value: "MAIL",      label: "Mail",           group: "Dienste" },
  { value: "MONITOR",   label: "Monitor",        group: "Dienste" },
];

function StartNode({ data }: NodeProps) {
  const d = data as NodeData;
  return (
    <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-500/15 px-5 py-3 shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/10 min-w-[180px] max-w-[280px]">
      <Handle type="source" position={Position.Right} className="!-right-[6px]" />
      <div className="flex items-center gap-2">
        <Play className="h-4 w-4 shrink-0 fill-emerald-400 text-emerald-400" />
        <span className="text-sm font-bold leading-snug text-emerald-300">{d.label || "Start"}</span>
      </div>
      {d.description && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-emerald-400/60 border-t border-emerald-500/20 pt-1.5">
          {String(d.description)}
        </p>
      )}
    </div>
  );
}

function EndNode({ data }: NodeProps) {
  const d = data as NodeData;
  return (
    <div className="rounded-2xl border-2 border-red-500 bg-red-500/15 px-5 py-3 shadow-lg shadow-red-500/20 ring-4 ring-red-500/10 min-w-[180px] max-w-[280px]">
      <Handle type="target" position={Position.Left} className="!-left-[6px]" />
      <div className="flex items-center gap-2">
        <Square className="h-4 w-4 shrink-0 fill-red-400 text-red-400" />
        <span className="text-sm font-bold leading-snug text-red-300">{d.label || "Ende"}</span>
      </div>
      {d.description && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-red-400/60 border-t border-red-500/20 pt-1.5">
          {String(d.description)}
        </p>
      )}
    </div>
  );
}

function DocNode({ data }: NodeProps) {
  const d = data as NodeData;
  const cfg = NODE_CONFIG[d.nodeType] ?? NODE_CONFIG.SERVICE;
  const Icon = cfg.icon;
  const visibleCustomFields = (d.customFields ?? []).filter((f) => f.visible && f.key && f.value);

  return (
    <div className={`relative rounded-xl border border-zinc-700/50 bg-gradient-to-br ${cfg.bg} to-zinc-900/90 px-4 py-3 shadow-lg shadow-black/50 ring-2 ${cfg.ring} min-w-[190px] max-w-[280px] cursor-pointer transition-all hover:ring-4`}>
      <Handle type="target" position={Position.Left} className="!-left-[6px]" />
      <Handle type="source" position={Position.Right} className="!-right-[6px]" />

      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80">
          <Icon className={`h-4 w-4 ${cfg.color}`} />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="truncate text-sm font-semibold text-zinc-100">{d.label}</div>
          <div className={`text-[10px] uppercase tracking-widest ${cfg.color} opacity-80`}>{cfg.label}</div>

          {(d.ipAddress || d.port) && (
            <div className="mt-1 font-mono text-[10px] text-zinc-500">
              {d.ipAddress && <span>{String(d.ipAddress)}</span>}
              {d.ipAddress && d.port && <span className="mx-1 text-zinc-700">·</span>}
              {d.port && <span>{String(d.port)}</span>}
            </div>
          )}

          {d.description && (
            <div className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-zinc-500">{String(d.description)}</div>
          )}

          {visibleCustomFields.length > 0 && (
            <div className="mt-2 space-y-0.5 border-t border-zinc-800 pt-1.5">
              {visibleCustomFields.map((f) => (
                <div key={f.id} className="flex gap-1.5 text-[10px]">
                  <span className="shrink-0 text-zinc-600">{f.key}:</span>
                  <span className="truncate font-mono text-zinc-400">{f.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const NODE_TYPES: NodeTypes = {
  SERVICE:   DocNode,
  DATABASE:  DocNode,
  APP:       DocNode,
  EXTERNAL:  DocNode,
  SERVER:    DocNode,
  QUEUE:     DocNode,
  NETWORK:   DocNode,
  STORAGE:   DocNode,
  MAIL:      DocNode,
  CLOUD:     DocNode,
  CONTAINER: DocNode,
  MONITOR:   DocNode,
  START:     StartNode,
  END:       EndNode,
};
