import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const [uptime, mem, disk, updates] = await Promise.allSettled([
      execAsync("uptime -p"),
      execAsync("free -m | awk 'NR==2{printf \"%s/%sMB\", $3, $2}'"),
      execAsync("df -h / | awk 'NR==2{print $3\"/\"$2\" (\"$5\")\"}'"),
      execAsync("apt list --upgradable 2>/dev/null | grep -c upgradable || echo 0"),
    ]);

    // Sicherheitsupdates mit CVE-Hinweis
    let secUpdates: { pkg: string; version: string }[] = [];
    try {
      const { stdout } = await execAsync(
        "apt list --upgradable 2>/dev/null | grep -i 'security\|CVE' | head -20"
      );
      secUpdates = stdout.trim().split("\n").filter(Boolean).map((line) => {
        const [pkg, version] = line.split("/")[0].trim().split(" ");
        return { pkg: pkg ?? line, version: version ?? "" };
      });
    } catch { /* apt nicht verfügbar */ }

    return NextResponse.json({
      uptime:     uptime.status === "fulfilled" ? uptime.value.stdout.trim() : "–",
      memory:     mem.status === "fulfilled"    ? mem.value.stdout.trim()    : "–",
      disk:       disk.status === "fulfilled"   ? disk.value.stdout.trim()   : "–",
      updateCount: updates.status === "fulfilled" ? parseInt(updates.value.stdout.trim()) - 1 : 0,
      securityUpdates: secUpdates,
      appVersion: process.env.APP_VERSION ?? "1.0.0",
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// Linux-Updates anwenden
export async function POST() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // Läuft im Hintergrund — stream via SSE wäre ideal, hier simpel
    execAsync("apt-get update && apt-get upgrade -y 2>&1").catch(() => {});
    return NextResponse.json({ message: "System-Update gestartet. Kann einige Minuten dauern." });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
