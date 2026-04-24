"use client";
import { useState } from "react";
import Link from "next/link";
import { Network, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
    } catch {
      setError("Verbindungsfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-600/10">
            <Network className="h-6 w-6 text-indigo-400" />
          </div>
          <CardTitle className="text-xl">Passwort vergessen</CardTitle>
          <CardDescription>Wir senden dir einen Reset-Link per E-Mail.</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              <p className="font-medium text-zinc-200">E-Mail gesendet</p>
              <p className="text-sm text-muted-foreground">
                Falls ein Konto mit dieser E-Mail-Adresse existiert und SMTP konfiguriert ist,
                erhältst du in Kürze einen Reset-Link.
              </p>
              <Link href="/login" className="mt-2 flex items-center gap-1 text-sm text-indigo-400 hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" />Zurück zum Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>E-Mail-Adresse</Label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoFocus
                  autoComplete="email"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sende…</> : "Reset-Link senden"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                <Link href="/login" className="text-indigo-400 hover:underline">Zurück zum Login</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
