import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const IMAGE = process.env.DOCKER_IMAGE ?? "ghcr.io/your-org/topograph:latest";
const COMPOSE_DIR = process.env.COMPOSE_DIR ?? "/opt/topograph";

export async function POST() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // Neues Image ziehen
    await execAsync(`docker pull ${IMAGE}`);

    // Container neu starten (fire-and-forget nach kurzer Pause)
    setTimeout(async () => {
      try {
        await execAsync(`cd ${COMPOSE_DIR} && docker compose up -d --remove-orphans`);
      } catch { /* Container-Neustart bricht eigene Verbindung ab */ }
    }, 2000);

    return NextResponse.json({ message: "Image gezogen. Container startet in Kürze neu…" });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
