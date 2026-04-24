import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const REPO            = process.env.UPDATE_REPO            ?? "CoreXManagement/topograph";
const CURRENT_VERSION = process.env.APP_VERSION            ?? "dev";

function versionGt(a: string, b: string): boolean {
  // Vergleich: a > b (semver-ähnlich, simple Punkte-Split)
  if (a === "dev" || b === "dev") return false;
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff > 0) return true;
    if (diff < 0) return false;
  }
  return false;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const user    = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "topograph-updater",
        },
        next: { revalidate: 300 }, // 5 Min. cachen
      }
    );

    if (!res.ok) {
      return NextResponse.json({ hasUpdate: false, current: CURRENT_VERSION });
    }

    const release  = await res.json();
    const latest   = (release.tag_name as string)?.replace(/^v/, "") ?? CURRENT_VERSION;
    const hasUpdate = versionGt(latest, CURRENT_VERSION);

    return NextResponse.json({
      current:     CURRENT_VERSION,
      latest,
      hasUpdate,
      releaseUrl:  release.html_url  as string,
      changelog:   ((release.body as string) ?? "").slice(0, 600),
      publishedAt: release.published_at as string,
    });
  } catch {
    return NextResponse.json({ hasUpdate: false, current: CURRENT_VERSION });
  }
}
