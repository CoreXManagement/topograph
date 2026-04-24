"use client";
import { useEffect, useState } from "react";
import { ArrowUpCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpdateInfo {
  current: string;
  latest: string;
  hasUpdate: boolean;
  releaseUrl: string;
  changelog: string;
}

export function UpdateBanner() {
  const [info, setInfo]         = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/updates/check")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d?.hasUpdate ? setInfo(d) : null)
      .catch(() => null);
  }, []);

  if (!info || dismissed) return null;

  async function handleUpdate() {
    setUpdating(true);
    setUpdateMsg("Image wird gezogen…");
    try {
      const res = await fetch("/api/admin/updates/apply", { method: "POST" });
      const d   = await res.json();
      setUpdateMsg(d.message ?? "Update gestartet. Container startet neu…");
      if (res.ok) setTimeout(() => window.location.reload(), 8000);
    } catch {
      setUpdateMsg("Fehler beim Update. Bitte manuell: docker compose pull && up -d");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="flex items-center gap-3 border-b border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm">
      <ArrowUpCircle className="h-4 w-4 shrink-0 text-indigo-400" />
      <span className="flex-1 text-xs text-indigo-200">
        {updateMsg ?? (
          <>Update verfügbar: <strong>v{info.latest}</strong> (aktuell: v{info.current}) — <a href={info.releaseUrl} target="_blank" rel="noreferrer" className="underline opacity-70 hover:opacity-100">Changelog</a></>
        )}
      </span>
      {!updateMsg && (
        <Button size="sm" variant="outline" className="h-6 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20 text-xs px-2" onClick={handleUpdate} disabled={updating}>
          {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Jetzt updaten"}
        </Button>
      )}
      <button onClick={() => setDismissed(true)} className="text-indigo-400/50 hover:text-indigo-300">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
