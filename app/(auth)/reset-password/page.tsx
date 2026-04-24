"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Network, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm)  { setError("Passwörter stimmen nicht überein."); return; }
    if (password.length < 8)   { setError("Passwort muss mindestens 8 Zeichen haben."); return; }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error ?? "Fehler beim Zurücksetzen."); setLoading(false); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        <p className="font-medium text-emerald-300">Passwort geändert!</p>
        <p className="text-xs text-muted-foreground">Weiterleitung zum Login…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Neues Passwort</Label>
        <Input type="password" placeholder="Mind. 8 Zeichen" value={password}
          onChange={(e) => setPassword(e.target.value)} disabled={loading} autoFocus autoComplete="new-password" />
      </div>
      <div className="space-y-1.5">
        <Label>Passwort wiederholen</Label>
        <Input type="password" placeholder="Passwort bestätigen" value={confirm}
          onChange={(e) => setConfirm(e.target.value)} disabled={loading} autoComplete="new-password" />
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={loading || !password || !confirm}>
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Speichern…</> : "Passwort speichern"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        <Link href="/login" className="text-indigo-400 hover:underline">Zurück zum Login</Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-600/10">
            <Network className="h-6 w-6 text-indigo-400" />
          </div>
          <CardTitle className="text-xl">Neues Passwort</CardTitle>
          <CardDescription>Gib dein neues Passwort ein.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}>
            <ResetForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
