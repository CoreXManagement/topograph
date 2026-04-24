"use client";
import { useState, useEffect } from "react";
import { Settings, Loader2, RefreshCw, Save, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface AppSettings {
  allow_registration: string;
  app_name: string;
}

export default function SettingsPage() {
  const [settings, setSettings]   = useState<AppSettings | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [appName, setAppName]     = useState("");
  const [regAllowed, setRegAllowed] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/settings");
    if (res.ok) {
      const d: AppSettings = await res.json();
      setSettings(d);
      setAppName(d.app_name ?? "Topograph");
      setRegAllowed(d.allow_registration === "true");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    setSaving(true); setSaved(false);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_name: appName.trim() || "Topograph",
        allow_registration: regAllowed ? "true" : "false",
      }),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Einstellungen</h1>
          <p className="text-sm text-muted-foreground">App-Konfiguration & Zugriffssteuerung</p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-5">
          {/* App-Name */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-400" />
              <span className="font-medium">App-Name</span>
            </div>
            <div className="space-y-1.5">
              <Label>Name der Anwendung</Label>
              <Input
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Topograph"
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">Wird in der Sidebar und auf der Login-Seite angezeigt.</p>
            </div>
          </div>

          {/* Registrierung */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-400" />
              <span className="font-medium">Nutzerzugang</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-zinc-700/60 bg-zinc-800/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Freie Registrierung erlauben</p>
                <p className="text-xs text-muted-foreground">
                  Wenn aktiv, können sich neue Nutzer selbst registrieren. Sie erhalten automatisch die Rolle <strong>Mitglied</strong>.
                </p>
              </div>
              <div className="ml-4 flex items-center gap-3">
                <Badge variant={regAllowed ? "green" : "zinc"}>
                  {regAllowed ? "Aktiv" : "Deaktiviert"}
                </Badge>
                <button
                  onClick={() => setRegAllowed((v) => !v)}
                  className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none ${regAllowed ? "bg-indigo-600" : "bg-zinc-700"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${regAllowed ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>

            {regAllowed && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-300">
                Hinweis: Jeder mit Zugang zur App-URL kann sich registrieren. Empfohlen nur in abgesicherten Umgebungen (Intranet, VPN).
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Speichern…" : "Einstellungen speichern"}
            </Button>
            {saved && <span className="text-sm text-emerald-400">Gespeichert ✓</span>}
          </div>
        </div>
      )}
    </div>
  );
}
