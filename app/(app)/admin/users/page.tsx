"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, ShieldCheck, User, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface TgUser {
  id: string; email: string; name: string | null;
  role: string; auth_source: string;
  created_at: string; last_login: string | null;
}

export default function UsersPage() {
  const [users, setUsers]   = useState<TgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]     = useState(false);
  const [email, setEmail]   = useState("");
  const [name, setName]     = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]     = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!email.trim() || !password) return;
    setSaving(true); setErr(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password, role }),
    });
    if (res.ok) {
      setOpen(false); setEmail(""); setName(""); setPassword(""); setRole("MEMBER");
      load();
    } else {
      const d = await res.json();
      setErr(d.error ?? "Fehler");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Nutzer wirklich löschen?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setUsers((u) => u.filter((x) => x.id !== id));
  }

  async function toggleRole(id: string, current: string) {
    const next = current === "ADMIN" ? "MEMBER" : "ADMIN";
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: next }),
    });
    setUsers((u) => u.map((x) => x.id === id ? { ...x, role: next } : x));
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nutzerverwaltung</h1>
          <p className="text-sm text-muted-foreground">Lokale Konten & Rollen</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
          <Button size="sm" onClick={() => setOpen(true)} className="gap-1"><Plus className="h-4 w-4" />Nutzer anlegen</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${u.role === "ADMIN" ? "bg-indigo-600/20 text-indigo-400" : "bg-zinc-800 text-zinc-400"}`}>
                {(u.name ?? u.email)[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-200">{u.name ?? <span className="text-zinc-500">–</span>}</p>
                <p className="text-xs text-zinc-500">{u.email} · <span className="font-mono">{u.auth_source}</span></p>
              </div>
              <Badge variant={u.role === "ADMIN" ? "default" : "zinc"}>{u.role === "ADMIN" ? "Admin" : "Mitglied"}</Badge>
              <button onClick={() => toggleRole(u.id, u.role)} className="rounded p-1 text-zinc-600 hover:text-zinc-300" title="Rolle wechseln">
                {u.role === "ADMIN" ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </button>
              <button onClick={() => handleDelete(u.id)} className="rounded p-1 text-zinc-700 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {users.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">Noch keine Nutzer. Lege den ersten Administrator an.</p>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Neuer Nutzer</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5"><Label>E-Mail</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" type="email" /></div>
            <div className="space-y-1.5"><Label>Name <span className="text-zinc-600">(optional)</span></Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Max Mustermann" /></div>
            <div className="space-y-1.5"><Label>Passwort</Label><Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Sicheres Passwort" /></div>
            <div className="space-y-1.5">
              <Label>Rolle</Label>
              <select value={role} onChange={(e) => setRole(e.target.value as "MEMBER" | "ADMIN")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="MEMBER" className="bg-zinc-900">Mitglied</option>
                <option value="ADMIN" className="bg-zinc-900">Administrator</option>
              </select>
            </div>
            {err && <p className="text-xs text-destructive">{err}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button onClick={handleCreate} disabled={saving || !email.trim() || !password} className="gap-1">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Anlegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
