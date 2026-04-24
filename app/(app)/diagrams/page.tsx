"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Network, Trash2, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Diagram {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  node_count: number;
}

export default function DiagramsPage() {
  const router = useRouter();
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    const res = await fetch("/api/diagrams");
    if (res.ok) setDiagrams(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!title.trim()) return;
    setCreating(true);
    const res = await fetch("/api/diagrams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description: description.trim() || null }),
    });
    if (res.ok) {
      const d = await res.json();
      router.push(`/diagrams/${d.id}`);
    }
    setCreating(false);
    setCreateOpen(false);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Diagramm wirklich löschen? Alle Nodes und Notizen werden gelöscht.")) return;
    await fetch(`/api/diagrams/${id}`, { method: "DELETE" });
    setDiagrams((d) => d.filter((x) => x.id !== id));
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Diagramme</h1>
          <p className="text-sm text-muted-foreground">Systemtopologien, Projektstrukturen, Abhängigkeiten</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Neues Diagramm
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : diagrams.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-700 py-20 text-center">
          <Network className="h-10 w-10 text-zinc-600" />
          <div>
            <p className="text-sm font-medium text-zinc-300">Noch keine Diagramme</p>
            <p className="text-xs text-muted-foreground">Erstelle dein erstes Diagramm, um Systemverbindungen zu dokumentieren.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="mt-2 gap-2">
            <Plus className="h-4 w-4" />
            Diagramm erstellen
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {diagrams.map((d) => (
            <Card
              key={d.id}
              className="group cursor-pointer border-zinc-800 bg-zinc-900/50 transition-all hover:border-zinc-600 hover:bg-zinc-900/80 hover:shadow-lg hover:shadow-black/30"
              onClick={() => router.push(`/diagrams/${d.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <Network className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDelete(d.id, e)}
                      className="rounded p-1 text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
                <CardTitle className="text-sm leading-tight mt-2">{d.title}</CardTitle>
                {d.description && <CardDescription className="text-xs line-clamp-2">{d.description}</CardDescription>}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-[10px] text-zinc-600">
                  <span className="flex items-center gap-1">
                    <Network className="h-3 w-3" />
                    {d.node_count} {d.node_count === 1 ? "Node" : "Nodes"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(d.updated_at).toLocaleDateString("de-DE")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Diagramm erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="z.B. Netzwerk-Übersicht, Projektstruktur, Workflow..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung <span className="text-zinc-600">(optional)</span></Label>
              <Textarea
                placeholder="Kurze Beschreibung des Diagramms..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Abbrechen</Button>
            <Button onClick={handleCreate} disabled={creating || !title.trim()} className="gap-1">
              {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
