"use client";
import { useEffect, useState, useCallback } from "react";
import { ArrowUpCircle, X, Loader2, RefreshCw, GitCommit } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpdateInfo {
  mode:       "sha" | "semver";
  current:    string;
  currentSha: string | null;
  latest:     string;
  latestSha:  string | null;
  hasUpdate:  boolean;
  releaseUrl: string;
  changelog:  string;
  publishedAt: string | null;
}

const POLL_INTERVAL = 5 * 60 * 1000; // 5 Minuten

export function UpdateBanner() {
  const [info, setInfo]           = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating]   = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [checking, setChecking]   = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const check = useCallback(async (manual = false) => {
    if (manual) setChecking(true);
    try {
      const res = await fetch("/api/admin/updates/check");
      if (!res.ok) return;
      const d: UpdateInfo = await res.json();
      setLastCheck(new Date());
      if (d.hasUpdate) {
        setInfo(d);
        setDismissed(false); // bei manuellem Check Banner wieder zeigen
      } else if (manual) {
        // manueller Check ohne Update → kurz bestätigen
        setInfo({ ...d, hasUpdate: false });
        setTimeout(() => setInfo(null), 3000);
      }
    } catch { /* ignore */ } finally {
      if (manual) setChecking(false);
    }
  }, []);

  // Beim Mount + alle 5 Minuten prüfen
  useEffect(() => {
    check();
    const timer = setInterval(() => check(), POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [check]);

  async function handleUpdate() {
    setUpdating(true);
    setUpdateMsg("Neues Image wird geladen…");
    try {
      const res = await fetch("/api/admin/updates/apply", { method: "POST" });
      const d   = await res.json();
      setUpdateMsg(d.message ?? "Update gestartet. Container startet in Kürze neu…");
      if (res.ok) {
        setTimeout(() => window.location.reload(), 10000);
      }
    } catch {
      setUpdateMsg("Fehler. Manuell: docker compose pull && docker compose up -d");
    } finally {
      setUpdating(false);
    }
  }

  // Kein Update → Banner nur bei manuellem Check kurz anzeigen
  if (!info) return null;
  if (!info.hasUpdate && !dismissed) {
    // "Kein Update verfügbar" nach manuellem Check
    return (
      <div className="flex items-center gap-2 border-b border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs text-emerald-400">
        <RefreshCw className="h-3 w-3 shrink-0" />
        <span>Aktuell — keine Updates ({info.current})</span>
      </div>
    );
  }
  if (!info.hasUpdate || dismissed) return null;

  const timeAgo = info.publishedAt
    ? (() => {
        const diff = Date.now() - new Date(info.publishedAt).getTime();
        const h = Math.floor(diff / 3600000);
        if (h < 1) return "vor wenigen Minuten";
        if (h < 24) return `vor ${h}h`;
        return `vor ${Math.floor(h / 24)}d`;
      })()
    : null;

  return (
    <div className="flex items-center gap-3 border-b border-indigo-500/30 bg-indigo-500/10 px-4 py-2" data-print="hide">
      <ArrowUpCircle className="h-4 w-4 shrink-0 text-indigo-400" />

      <div className="min-w-0 flex-1">
        {updateMsg ? (
          <span className="text-xs text-indigo-200">{updateMsg}</span>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="text-xs font-medium text-indigo-200">
              Update verfügbar{timeAgo ? ` (${timeAgo})` : ""}
            </span>
            <span className="font-mono text-[10px] text-indigo-400/70">
              {info.current} → {info.latest}
            </span>
            {info.changelog && (
              <span className="flex items-center gap-1 text-[10px] text-indigo-300/60">
                <GitCommit className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[280px]">{info.changelog}</span>
              </span>
            )}
            <a
              href={info.releaseUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-indigo-400 underline hover:text-indigo-300"
            >
              Details →
            </a>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!updateMsg && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-6 border-indigo-500/40 px-2 text-[10px] text-indigo-300 hover:bg-indigo-500/20"
              onClick={() => check(true)}
              disabled={checking}
              title="Erneut prüfen"
            >
              <RefreshCw className={`h-3 w-3 ${checking ? "animate-spin" : ""}`} />
            </Button>
            <Button
              size="sm"
              className="h-6 bg-indigo-600 px-3 text-[11px] hover:bg-indigo-500"
              onClick={handleUpdate}
              disabled={updating}
            >
              {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Updaten"}
            </Button>
          </>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="text-indigo-400/40 hover:text-indigo-300"
          title="Schließen"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
