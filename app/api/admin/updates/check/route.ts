import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const REPO    = process.env.UPDATE_REPO  ?? "CoreXManagement/topograph";
const CURRENT = process.env.APP_VERSION  ?? "dev";

// Liefert kurzen SHA aus "sha-abc1234" → "abc1234"
function extractSha(version: string): string | null {
  return version.startsWith("sha-") ? version.slice(4) : null;
}

// Semver-Vergleich: a > b?
function semverGt(a: string, b: string): boolean {
  if (a === "dev" || b === "dev") return false;
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

async function ghFetch(url: string) {
  return fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "topograph-updater",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
    next: { revalidate: 300 }, // 5 Min. Cache
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const user    = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const currentSha = extractSha(CURRENT);

  try {
    // ── SHA-basiert (push to main ohne Releases) ─────────────────────────────
    if (currentSha || CURRENT === "dev") {
      const res = await ghFetch(`https://api.github.com/repos/${REPO}/commits/main`);
      if (!res.ok) return NextResponse.json({ hasUpdate: false, current: CURRENT });

      const commit = await res.json();
      const latestSha   = (commit.sha as string).slice(0, 7);
      const latestFull  = commit.sha as string;
      const message     = (commit.commit?.message as string ?? "").split("\n")[0].slice(0, 80);
      const committedAt = commit.commit?.author?.date as string | undefined;
      const commitUrl   = `https://github.com/${REPO}/commit/${latestFull}`;

      // Bei "dev" (lokale Entwicklung) nie Update anzeigen
      const hasUpdate = CURRENT !== "dev" && latestSha !== currentSha;

      return NextResponse.json({
        mode:       "sha",
        current:    CURRENT,
        currentSha,
        latest:     `sha-${latestSha}`,
        latestSha,
        hasUpdate,
        changelog:  message,
        releaseUrl: commitUrl,
        publishedAt: committedAt ?? null,
      });
    }

    // ── Semver (Tagged Releases) ──────────────────────────────────────────────
    const res = await ghFetch(`https://api.github.com/repos/${REPO}/releases/latest`);
    if (!res.ok) return NextResponse.json({ hasUpdate: false, current: CURRENT });

    const release   = await res.json();
    const latest    = (release.tag_name as string)?.replace(/^v/, "") ?? CURRENT;
    const hasUpdate = semverGt(latest, CURRENT);

    return NextResponse.json({
      mode:       "semver",
      current:    CURRENT,
      latest,
      hasUpdate,
      changelog:  ((release.body as string) ?? "").split("\n").slice(0, 5).join("\n"),
      releaseUrl: release.html_url as string,
      publishedAt: release.published_at as string,
    });
  } catch (e) {
    console.error("[update-check]", e);
    return NextResponse.json({ hasUpdate: false, current: CURRENT });
  }
}
