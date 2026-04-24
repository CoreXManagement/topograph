"use client";
import { useState, useEffect } from "react";
import { Server, HardDrive, Cpu, RefreshCw, ArrowUpCircle, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SysInfo {
  uptime: string; memory: string; disk: string;
  updateCount: number; appVersion: string;
  securityUpdates: { pkg: string; version: string }[];
}

export default function SystemPage() {
  const [info, setInfo]         = useState<SysInfo | null>(null);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg]           = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/system");
    if (res.ok) setInfo(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleLinuxUpdate() {
    setUpdating(true);
    const res = await fetch("/api/admin/system", { method: "POST" });
    const d   = await res.json();
    setMsg(d.message ?? d.error);
    setUpdating(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System</h1>
          <p className="text-sm text-muted-foreground">Server-Status & Updates</p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading} className="gap-1">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Aktualisieren
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : info ? (
        <>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Uptime",   value: info.uptime,  icon: Server },
              { label: "RAM",      value: info.memory,  icon: Cpu },
              { label: "Disk",     value: info.disk,    icon: HardDrive },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">{label}</span></div>
                <p className="mt-2 font-mono text-sm text-zinc-200">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-indigo-400" />
                <span className="font-medium">Linux-Updates</span>
                {info.updateCount > 0 && (
                  <Badge variant="amber" className="text-xs">{info.updateCount} verfügbar</Badge>
                )}
              </div>
              <Button size="sm" onClick={handleLinuxUpdate} disabled={updating || info.updateCount === 0} className="gap-1">
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpCircle className="h-4 w-4" />}
                {info.updateCount === 0 ? "Aktuell" : "Jetzt updaten"}
              </Button>
            </div>

            {info.securityUpdates.length > 0 && (
              <div className="space-y-1">
                <p className="flex items-center gap-1 text-xs font-medium text-amber-400"><ShieldAlert className="h-3.5 w-3.5" />Sicherheitsupdates</p>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-2 font-mono text-[11px] text-zinc-400 space-y-0.5">
                  {info.securityUpdates.map((u, i) => (
                    <p key={i}><span className="text-zinc-200">{u.pkg}</span> {u.version && <span className="text-zinc-600">→ {u.version}</span>}</p>
                  ))}
                </div>
              </div>
            )}

            {msg && <p className="text-xs text-indigo-300 bg-indigo-500/10 rounded px-3 py-2">{msg}</p>}
          </div>

          <p className="text-[11px] text-muted-foreground">App-Version: v{info.appVersion}</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Systeminfo nicht verfügbar (nur auf Linux-Host).</p>
      )}
    </div>
  );
}
