"use client";
import { useState, useEffect, useCallback } from "react";
import { X, Trash2, Plus, StickyNote, Save, Eye, EyeOff, GripVertical, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { NODE_TYPE_OPTIONS, type NodeType, type CustomField } from "./node-types";

// Smart field labels per node type
const TYPE_FIELDS: Record<NodeType, { f1: string; f1ph: string; f2: string; f2ph: string }> = {
  SERVICE:   { f1: "IP / Host",       f1ph: "192.168.1.1",            f2: "Port",              f2ph: "8080" },
  DATABASE:  { f1: "IP / Host",       f1ph: "192.168.1.20",           f2: "Port / DB-Name",    f2ph: "5432 · mydb" },
  APP:       { f1: "URL / Host",      f1ph: "app.example.com",        f2: "Version",           f2ph: "v1.2.3" },
  EXTERNAL:  { f1: "URL",             f1ph: "https://api.example.com",f2: "Typ",               f2ph: "REST / GraphQL" },
  SERVER:    { f1: "IP-Adresse",      f1ph: "10.0.0.5",               f2: "OS / Programme",    f2ph: "Ubuntu 22 · nginx, node" },
  QUEUE:     { f1: "Host",            f1ph: "mq.internal",            f2: "Typ / Topic",       f2ph: "RabbitMQ · orders" },
  NETWORK:   { f1: "IP-Bereich",      f1ph: "192.168.10.0/24",        f2: "VLAN",              f2ph: "VLAN 10" },
  STORAGE:   { f1: "Kapazität",       f1ph: "10 TB",                  f2: "RAID / Typ",        f2ph: "RAID-6 · NFS" },
  MAIL:      { f1: "Mail-Host",       f1ph: "mail.example.com",       f2: "Protokoll",         f2ph: "IMAP · SMTP · Exchange" },
  CLOUD:     { f1: "Provider / Region",f1ph: "AWS · eu-central-1",   f2: "Dienste",           f2ph: "S3, EC2, RDS" },
  CONTAINER: { f1: "Rack / Schrank",  f1ph: "Rack-A",                 f2: "HE-Position",       f2ph: "HE 12–14" },
  MONITOR:   { f1: "Host / IP",       f1ph: "10.0.0.1",               f2: "Check-Intervall",   f2ph: "30s" },
  START:     { f1: "",                f1ph: "",                        f2: "",                  f2ph: "" },
  END:       { f1: "",                f1ph: "",                        f2: "",                  f2ph: "" },
};

interface Note {
  id: string;
  content: string;
  created_by: string | null;
  created_at: string;
}

interface NodePanelProps {
  nodeId: string;
  data: {
    label: string;
    nodeType: NodeType;
    ipAddress?: string | null;
    port?: string | null;
    description?: string | null;
    customFields?: CustomField[];
  };
  onClose: () => void;
  onUpdate: (nodeId: string, updates: Partial<{
    label: string; nodeType: NodeType; ipAddress: string;
    port: string; description: string; customFields: CustomField[];
  }>) => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
}

export function NodePanel({ nodeId, data, onClose, onUpdate, onDelete, onDuplicate }: NodePanelProps) {
  const [label, setLabel]           = useState(data.label);
  const [nodeType, setNodeType]     = useState<NodeType>(data.nodeType);
  const [ipAddress, setIpAddress]   = useState(data.ipAddress ?? "");
  const [port, setPort]             = useState(data.port ?? "");
  const [description, setDescription] = useState(data.description ?? "");
  const [customFields, setCustomFields] = useState<CustomField[]>(data.customFields ?? []);
  const [notes, setNotes]           = useState<Note[]>([]);
  const [newNote, setNewNote]       = useState("");
  const [saving, setSaving]         = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState("");

  const fieldCfg = TYPE_FIELDS[nodeType] ?? TYPE_FIELDS.SERVICE;
  const isWorkflowNode = nodeType === "START" || nodeType === "END";

  useEffect(() => {
    setLabel(data.label);
    setNodeType(data.nodeType);
    setIpAddress(data.ipAddress ?? "");
    setPort(data.port ?? "");
    setDescription(data.description ?? "");
    setCustomFields(data.customFields ?? []);
  }, [nodeId, data]);

  const loadNotes = useCallback(async () => {
    const res = await fetch(`/api/nodes/${nodeId}/notes`);
    if (res.ok) setNotes(await res.json());
  }, [nodeId]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/nodes/${nodeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, nodeType, ipAddress, port, description, customFields }),
    });
    onUpdate(nodeId, { label, nodeType, ipAddress, port, description, customFields });
    setSaving(false);
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setNoteSaving(true);
    const res = await fetch(`/api/nodes/${nodeId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newNote.trim() }),
    });
    if (res.ok) { setNewNote(""); await loadNotes(); }
    setNoteSaving(false);
  }

  async function handleDeleteNote(noteId: string) {
    await fetch(`/api/nodes/${nodeId}/notes/${noteId}`, { method: "DELETE" });
    setNotes((n) => n.filter((x) => x.id !== noteId));
  }

  function addCustomField() {
    const key = newFieldKey.trim();
    if (!key) return;
    setCustomFields((f) => [...f, { id: crypto.randomUUID(), key, value: "", visible: true }]);
    setNewFieldKey("");
  }

  function updateCustomField(id: string, patch: Partial<CustomField>) {
    setCustomFields((f) => f.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function removeCustomField(id: string) {
    setCustomFields((f) => f.filter((x) => x.id !== id));
  }

  return (
    <div className="node-panel animate-slide-in fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950/98 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4" data-print="hide">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">{data.label}</h2>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{nodeType}</p>
        </div>
        <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-zinc-800 hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Basic fields */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Node-Name" />
          </div>

          <div className="space-y-1.5">
            <Label>Typ</Label>
            <select
              value={nodeType}
              onChange={(e) => setNodeType(e.target.value as NodeType)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {["Workflow", "Software", "Infrastruktur", "Dienste"].map((group) => (
                <optgroup key={group} label={group} className="bg-zinc-900 text-xs text-zinc-500">
                  {NODE_TYPE_OPTIONS.filter((o) => o.group === group).map((o) => (
                    <option key={o.value} value={o.value} className="bg-zinc-900">{o.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Type-specific fields */}
          {!isWorkflowNode && fieldCfg.f1 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{fieldCfg.f1}</Label>
                <Input value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} placeholder={fieldCfg.f1ph} className="font-mono text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label>{fieldCfg.f2}</Label>
                <Input value={port} onChange={(e) => setPort(e.target.value)} placeholder={fieldCfg.f2ph} className="font-mono text-xs" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{isWorkflowNode ? "Nachricht / Details" : "Beschreibung"}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                nodeType === "START" ? "z.B. Praktikant bewirbt sich bei der Stadt…"
                : nodeType === "END"  ? "z.B. Praktikant abgeschlossen, Zeugnis ausgehändigt"
                : "Was macht dieser Node?"
              }
              rows={3}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} size="sm" className="w-full gap-1">
            <Save className="h-3.5 w-3.5" />
            {saving ? "Speichere..." : "Speichern"}
          </Button>
        </div>

        {/* Custom Fields */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Custom-Felder</span>
            <Badge variant="zinc" className="ml-auto">{customFields.length}</Badge>
          </div>

          <div className="space-y-2">
            {customFields.map((field) => (
              <div key={field.id} className="flex items-center gap-2">
                <button
                  onClick={() => updateCustomField(field.id, { visible: !field.visible })}
                  className={`shrink-0 transition-colors ${field.visible ? "text-cyan-400" : "text-zinc-700"}`}
                  title={field.visible ? "Auf Node sichtbar" : "Versteckt"}
                >
                  {field.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <Input
                  value={field.key}
                  onChange={(e) => updateCustomField(field.id, { key: e.target.value })}
                  placeholder="Feld-Name"
                  className="h-7 w-1/3 shrink-0 text-xs"
                />
                <Input
                  value={field.value}
                  onChange={(e) => updateCustomField(field.id, { value: e.target.value })}
                  placeholder="Wert"
                  className="h-7 flex-1 font-mono text-xs"
                />
                <button onClick={() => removeCustomField(field.id)} className="shrink-0 text-zinc-700 hover:text-red-400 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newFieldKey}
              onChange={(e) => setNewFieldKey(e.target.value)}
              placeholder="Neues Feld (z.B. Seriennummer)"
              className="h-7 text-xs"
              onKeyDown={(e) => { if (e.key === "Enter") addCustomField(); }}
            />
            <Button size="sm" variant="outline" className="h-7 shrink-0 px-2" onClick={addCustomField} disabled={!newFieldKey.trim()}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-[10px] text-zinc-700">Auge = auf Node-Karte anzeigen · Enter = Feld hinzufügen</p>
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Notizen</span>
            <Badge variant="zinc" className="ml-auto">{notes.length}</Badge>
          </div>

          <div className="space-y-2">
            {notes.map((note) => (
              <div key={note.id} className="group relative rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <p className="text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap pr-6">{note.content}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-600">
                    {note.created_by && <span className="mr-1">{note.created_by} ·</span>}
                    {new Date(note.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <button onClick={() => handleDeleteNote(note.id)} className="text-zinc-700 hover:text-red-400 transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Neue Notiz..."
              rows={2}
              onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleAddNote(); }}
            />
            <Button onClick={handleAddNote} disabled={noteSaving || !newNote.trim()} size="sm" variant="secondary" className="w-full gap-1">
              <Plus className="h-3.5 w-3.5" />
              {noteSaving ? "Hinzufügen..." : "Notiz hinzufügen"}
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-4 space-y-2">
        <Button variant="outline" size="sm" className="w-full gap-1" onClick={() => { onDuplicate(nodeId); onClose(); }}>
          <Copy className="h-3.5 w-3.5" />
          Node duplizieren
        </Button>
        <Button variant="destructive" size="sm" className="w-full gap-1" onClick={() => { onDelete(nodeId); onClose(); }}>
          <Trash2 className="h-3.5 w-3.5" />
          Node löschen
        </Button>
      </div>
    </div>
  );
}
