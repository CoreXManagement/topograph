"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Network, Loader2, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    fetch("/api/setup")
      .then((r) => r.json())
      .then((d) => {
        if (!d.required) router.replace("/login");
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwörter stimmen nicht überein."); return; }
    if (password.length < 8)  { setError("Passwort muss mindestens 8 Zeichen haben."); return; }

    setLoading(true);
    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error ?? "Fehler beim Einrichten."); setLoading(false); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/15 border border-indigo-500/30">
            <Network className="h-7 w-7 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Willkommen bei Topograph</h1>
          <p className="text-sm text-muted-foreground">Erster Start erkannt. Lege jetzt den Administrator-Account an.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-indigo-400" />
              Administrator einrichten
            </CardTitle>
            <CardDescription>
              Dieser Account erhält vollen Zugriff und kann weitere Nutzer verwalten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                <p className="font-medium text-emerald-300">Administrator angelegt!</p>
                <p className="text-xs text-muted-foreground">Weiterleitung zum Login…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Name <span className="text-zinc-600">(optional)</span></Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Max Mustermann" autoFocus />
                </div>
                <div className="space-y-1.5">
                  <Label>E-Mail</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="admin@example.com" autoComplete="email" />
                </div>
                <div className="space-y-1.5">
                  <Label>Passwort</Label>
                  <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mind. 8 Zeichen" autoComplete="new-password" />
                </div>
                <div className="space-y-1.5">
                  <Label>Passwort wiederholen</Label>
                  <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" placeholder="Passwort bestätigen" autoComplete="new-password" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !email.trim() || !password || !confirm}
                >
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Einrichten…</> : "Administrator anlegen"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-zinc-600">
          Du kannst den Admin-Account später in den Einstellungen ändern.
        </p>
      </div>
    </div>
  );
}
