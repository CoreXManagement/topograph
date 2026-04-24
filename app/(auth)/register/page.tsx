"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Network, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
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
    fetch("/api/register")
      .then((r) => r.json())
      .then((d) => {
        if (!d.allowed) router.replace("/login");
        else setChecking(false);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwörter stimmen nicht überein."); return; }
    if (password.length < 8)  { setError("Passwort muss mindestens 8 Zeichen haben."); return; }

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error ?? "Fehler bei der Registrierung."); setLoading(false); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-600/10">
            <Network className="h-6 w-6 text-indigo-400" />
          </div>
          <CardTitle className="text-2xl">Konto erstellen</CardTitle>
          <CardDescription>Registriere dich für Topograph</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              <p className="font-medium text-emerald-300">Konto erstellt!</p>
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
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@example.com" autoComplete="email" />
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
              <Button type="submit" className="w-full" disabled={loading || !email.trim() || !password || !confirm}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registrieren…</> : "Konto erstellen"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Bereits registriert?{" "}
                <Link href="/login" className="text-indigo-400 hover:underline">Anmelden</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
