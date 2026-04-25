"use client";
import { useEffect, useState, useCallback } from "react";
import {
  ArrowUpCircle, X, Loader2, RefreshCw, GitCommit,
  Info, CheckCircle2, Wrench, Zap, Bug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Commit {
  sha:     string;
  message: string;
  author:  string;
  date:    string;
}

interface UpdateInfo {
  mode:         "sha" | "semver" | "dev";
  current:      string;
  currentSha:   string | null;
  latest:       string;
  latestSha:    string | null;
  hasUpdate:    boolean;
  commits:      Commit[];
  releaseNotes: string;
  releaseUrl:   string;
  publishedAt:  string | null;
}

const POLL_MS = 5 * 60 * 1000;

// Konventional-Commit Typen → Icon & Label
function commitMeta(message: string): { icon: React.ReactNode; label: string; color: string } {
  const m = message.toLowerCase();
  if (m.startsWith("feat"))    return { icon: <Zap className="h-3 w-3" />,          label: "Neu",      color: "text-cyan-400" };
  if (m.startsWith("fix"))     return { icon: <Bug className="h-3 w-3" />,           label: "Behoben",  color: "text-red-400" };
  if (m.startsWith("ci") || m.startsWith("build")) return { icon: <Wrench className="h-3 w-3" />, label: "CI/Build", color: "text-zinc-500" };
  if (m.startsWith("docs"))    return { icon: <Info className="h-3 w-3" />,           label: "Doku",     color: "text-zinc-500" };
  return                              { icon: <GitCommit className="h-3 w-3" />,      label: "Update",   color: "text-zinc-400" };
}

function stripPrefix(message: string): string {
  // "feat(scope): text" → "text"
  return message.replace(/^(feat|fix|ci|build|docs|refactor|chore|style|test)(\([^)]+\))?:\s*/i, "");
}

function timeAgo(isoDate: string | null): string {
  if (!isoDate) return "";
  const diff = Date.now() - new Date(isoDate).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1)  return "vor wenigen Minuten";
  if (h < 24) return `vor ${h} Stunde${h > 1 ? "n" : ""}`;
  const d = Math.floor(h / 24);
  return `vor ${d} Tag${d > 1 ? "en" : ""}`;
}

export function UpdateBanner() {
  const [info, setInfo]           = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking]   = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updating, setUpdating]   = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const check = useCallback(async (manual = false) => {
    if (manual) setChecking(true);
    try {
      const res = await fetch("/api/admin/updates/check");
      if (!res.ok) return;
      const d: UpdateInfo = await res.json();
      if (d.hasUpdate) {
        setInfo(d);
        if (manual) { setDismissed(false); setDetailOpen(true); }
      } else if (manual) {
        setInfo(d); // kurz anzeigen
        setTimeout(() => setInfo(null), 4000);
      }
    } catch { /* ignore */ } finally {
      if (manual) setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
    const t = setInterval(() => check(), POLL_MS);
    return () => clearInterval(t);
  }, [check]);

  async function handleUpdate() {
    setUpdating(true);
    setUpdateMsg("Neues Image wird geladen…");
    try {
      const res = await fetch("/api/admin/updates/apply", { method: "POST" });
      const d   = await res.json();
      setUpdateMsg(d.message ?? "Update gestartet. Container startet in Kürze neu…");
      if (res.ok) setTimeout(() => window.location.reload(), 10_000);
    } catch {
      setUpdateMsg("Fehler. Manuell: docker compose pull && docker compose up -d");
    } finally {
      setUpdating(false);
    }
  }

  // "Kein Update" nach manuellem Check
  if (info && !info.hasUpdate && !dismissed) {
    return (
      <div className="flex items-center gap-2 border-b border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs text-emerald-400" data-print="hide">
        <CheckCircle2 className="h-3 w-3 shrink-0" />
        <span>Aktuell ({info.current}) — kein Update verfügbar</span>
        <button onClick={() => setInfo(null)} className="ml-auto text-emerald-600 hover:text-emerald-400">
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  if (!info?.hasUpdate || dismissed) return null;

  const ago = timeAgo(info.publishedAt);

  return (
    <>
      {/* Kompakter Banner */}
      <div className="flex items-center gap-3 border-b border-indigo-500/30 bg-indigo-500/10 px-4 py-2" data-print="hide">
        <ArrowUpCircle className="h-4 w-4 shrink-0 text-indigo-400" />
        <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="text-xs font-medium text-indigo-200">
            Update verfügbar{ago ? ` · ${ago}` : ""}
          </span>
          <span className="font-mono text-[10px] text-indigo-400/60">
            {info.current} → {info.latest}
          </span>
          {info.commits.length > 0 && (
            <span className="text-[10px] text-indigo-300/50">
              {info.commits.length} Änderung{info.commits.length !== 1 ? "en" : ""}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-6 border-indigo-500/30 px-2 text-[11px] text-indigo-300 hover:bg-indigo-500/20"
            onClick={() => setDetailOpen(true)}
          >
            Was ist neu?
          </Button>
          <Button
            size="sm"
            className="h-6 bg-indigo-600 px-3 text-[11px] hover:bg-indigo-500"
            onClick={() => { setDetailOpen(true); }}
            disabled={updating}
          >
            Updaten
          </Button>
          <button
            onClick={() => check(true)}
            disabled={checking}
            className="text-indigo-400/40 hover:text-indigo-300"
            title="Erneut prüfen"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setDismissed(true)} className="text-indigo-400/30 hover:text-indigo-300">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Detail-Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-indigo-400" />
              Update verfügbar
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 space-y-4 pr-1">
            {/* Versionsinfo */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-500">Aktuell:</span>{" "}
                  <code className="text-zinc-300">{info.current}</code>
                </div>
                <div className="text-indigo-400">→</div>
                <div>
                  <span className="text-zinc-500">Neu:</span>{" "}
                  <code className="text-indigo-300">{info.latest}</code>
                </div>
              </div>
              {ago && <p className="mt-1.5 text-[11px] text-zinc-600">{ago} veröffentlicht</p>}
            </div>

            {/* Commit-Liste */}
            {info.commits.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-400">
                  {info.commits.length} Änderung{info.commits.length !== 1 ? "en" : ""} seit deiner Version:
                </p>
                <div className="space-y-1.5">
                  {info.commits.map((c) => {
                    const meta = commitMeta(c.message);
                    return (
                      <div key={c.sha} className="flex items-start gap-2.5 rounded-md border border-zinc-800/60 bg-zinc-900/40 px-3 py-2">
                        <span className={`mt-0.5 shrink-0 ${meta.color}`}>{meta.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-zinc-200 leading-snug">{stripPrefix(c.message)}</p>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-zinc-600">
                            <code>{c.sha}</code>
                            {c.author && <span>· {c.author}</span>}
                            {c.date && <span>· {timeAgo(c.date)}</span>}
                          </div>
                        </div>
                        <span className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-medium ${meta.color} bg-zinc-800/80`}>
                          {meta.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Release-Notes falls vorhanden */}
            {info.releaseNotes && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-zinc-400">Release-Notes:</p>
                <pre className="whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-[11px] leading-relaxed text-zinc-400 font-mono overflow-x-auto max-h-48 overflow-y-auto">
                  {info.releaseNotes.slice(0, 1500)}
                </pre>
              </div>
            )}

            {/* Update-Nachricht */}
            {updateMsg && (
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-xs text-indigo-300">
                {updateMsg}
              </div>
            )}

            {/* Hinweis */}
            <div className="rounded-lg border border-zinc-800/40 bg-zinc-900/20 px-4 py-3 text-[11px] text-zinc-600 space-y-1">
              <p>Der Container wird nach dem Update automatisch neu gestartet. Die App ist ca. 10–30 Sekunden nicht erreichbar.</p>
              <p>Manuell: <code className="text-zinc-500">docker compose pull && docker compose up -d</code></p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <a
              href={info.releaseUrl}
              target="_blank"
              rel="noreferrer"
              className="mr-auto text-xs text-indigo-400 hover:underline self-center"
            >
              Auf GitHub ansehen →
            </a>
            <Button variant="outline" onClick={() => setDetailOpen(false)} disabled={updating}>
              Schließen
            </Button>
            <Button
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-500"
              onClick={handleUpdate}
              disabled={updating || !!updateMsg}
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpCircle className="h-4 w-4" />}
              {updating ? "Update läuft…" : "Jetzt updaten"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
