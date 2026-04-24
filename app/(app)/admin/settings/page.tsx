"use client";
import { useState, useEffect } from "react";
import { Loader2, RefreshCw, Save, Users, Globe, Mail, Eye, EyeOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none ${value ? "bg-indigo-600" : "bg-zinc-700"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function Row({ label, desc, control }: { label: string; desc: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {control}
    </div>
  );
}

export default function SettingsPage() {
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [testState, setTestState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [testMsg, setTestMsg]     = useState("");
  const [showPw, setShowPw]       = useState(false);

  const [appName, setAppName]         = useState("Topograph");
  const [regAllowed, setRegAllowed]   = useState(false);
  const [emailWelcome, setEmailWelcome] = useState(false);
  const [smtpHost, setSmtpHost]       = useState("");
  const [smtpPort, setSmtpPort]       = useState("587");
  const [smtpSecure, setSmtpSecure]   = useState(false);
  const [smtpUser, setSmtpUser]       = useState("");
  const [smtpPassword, setSmtpPw]     = useState("");
  const [smtpFrom, setSmtpFrom]       = useState("");
  const [smtpFromName, setSmtpFromName] = useState("Topograph");
  const [resetExpiry, setResetExpiry] = useState("60");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/settings");
    if (res.ok) {
      const d = await res.json();
      setAppName(d.app_name ?? "Topograph");
      setRegAllowed(d.allow_registration === "true");
      setEmailWelcome(d.email_welcome === "true");
      setSmtpHost(d.smtp_host ?? "");
      setSmtpPort(d.smtp_port ?? "587");
      setSmtpSecure(d.smtp_secure === "true");
      setSmtpUser(d.smtp_user ?? "");
      setSmtpPw(d.smtp_password ?? "");
      setSmtpFrom(d.smtp_from ?? "");
      setSmtpFromName(d.smtp_from_name ?? "Topograph");
      setResetExpiry(d.email_reset_expiry_min ?? "60");
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
        email_welcome: emailWelcome ? "true" : "false",
        smtp_host: smtpHost.trim(),
        smtp_port: smtpPort || "587",
        smtp_secure: smtpSecure ? "true" : "false",
        smtp_user: smtpUser.trim(),
        smtp_password: smtpPassword,
        smtp_from: smtpFrom.trim(),
        smtp_from_name: smtpFromName.trim() || "Topograph",
        email_reset_expiry_min: resetExpiry || "60",
      }),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleTestEmail() {
    setTestState("sending"); setTestMsg("");
    const res = await fetch("/api/admin/settings/test-email", { method: "POST" });
    const d   = await res.json();
    if (res.ok) { setTestState("ok");    setTestMsg("Gesendet an " + d.to); }
    else        { setTestState("error"); setTestMsg(d.error ?? "Fehler"); }
    setTimeout(() => setTestState("idle"), 5000);
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const smtpConfigured = !!smtpHost.trim();

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Einstellungen</h1>
          <p className="text-sm text-muted-foreground">App-Konfiguration, Zugang und E-Mail</p>
        </div>
        <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {/* Allgemein */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-zinc-800/60 pb-3">
          <Globe className="h-4 w-4 text-indigo-400" />
          <span className="font-medium">Allgemein</span>
        </div>
        <div className="space-y-1.5">
          <Label>App-Name</Label>
          <Input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="Topograph" className="max-w-xs" />
          <p className="text-xs text-muted-foreground">Wird in Sidebar, Login-Seite und E-Mails angezeigt.</p>
        </div>
      </div>

      {/* Zugang */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800/60 pb-3">
          <Users className="h-4 w-4 text-indigo-400" />
          <span className="font-medium">Nutzerzugang</span>
        </div>
        <Row
          label="Freie Registrierung"
          desc="Neue Nutzer können sich selbst registrieren. Rolle: Mitglied."
          control={
            <div className="flex items-center gap-2">
              <Badge variant={regAllowed ? "green" : "zinc"}>{regAllowed ? "Aktiv" : "Aus"}</Badge>
              <Toggle value={regAllowed} onChange={setRegAllowed} />
            </div>
          }
        />
        {regAllowed && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-300">
            Empfohlen nur in abgesicherten Umgebungen (Intranet, VPN).
          </div>
        )}
        <Row
          label="Willkommens-E-Mail"
          desc="E-Mail nach Registrierung senden (benötigt SMTP-Konfiguration)."
          control={<Toggle value={emailWelcome} onChange={setEmailWelcome} />}
        />
      </div>

      {/* SMTP */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800/60 pb-3">
          <Mail className="h-4 w-4 text-indigo-400" />
          <span className="font-medium">E-Mail / SMTP</span>
          <Badge variant="zinc" className="ml-auto text-[10px]">Optional</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Ohne SMTP funktioniert die App vollständig — aber kein Passwort-Reset per E-Mail und keine Benachrichtigungen.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>SMTP-Host</Label>
            <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="mail.example.com" className="font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label>Port</Label>
            <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" className="font-mono text-xs" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Benutzername</Label>
            <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="user@example.com" autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label>Passwort</Label>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                value={smtpPassword}
                onChange={(e) => setSmtpPw(e.target.value)}
                placeholder="SMTP-Passwort"
                autoComplete="new-password"
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Absender-Adresse</Label>
            <Input value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)} placeholder="noreply@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Absender-Name</Label>
            <Input value={smtpFromName} onChange={(e) => setSmtpFromName(e.target.value)} placeholder="Topograph" />
          </div>
        </div>

        <Row
          label="SSL/TLS (Port 465)"
          desc="Für Port 587 (STARTTLS) deaktiviert lassen."
          control={<Toggle value={smtpSecure} onChange={setSmtpSecure} />}
        />

        <div className="space-y-1.5">
          <Label>Reset-Link Ablauf (Minuten)</Label>
          <Input
            value={resetExpiry}
            onChange={(e) => setResetExpiry(e.target.value)}
            type="number" min={5} max={1440}
            className="w-28 font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleTestEmail}
            disabled={testState === "sending" || !smtpConfigured}
            className="gap-1.5"
          >
            {testState === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Test-E-Mail senden
          </Button>
          {testMsg && (
            <span className={`text-xs ${testState === "ok" ? "text-emerald-400" : "text-red-400"}`}>
              {testState === "ok" ? "✓" : "✗"} {testMsg}
            </span>
          )}
        </div>
        <p className="text-[11px] text-zinc-600">Test-E-Mail wird an deine Admin-E-Mail gesendet. Zuerst speichern, dann testen.</p>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-1">
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Speichern…" : "Einstellungen speichern"}
        </Button>
        {saved && <span className="text-sm text-emerald-400">Gespeichert ✓</span>}
      </div>
    </div>
  );
}
