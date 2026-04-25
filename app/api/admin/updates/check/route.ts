import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const REPO    = process.env.UPDATE_REPO ?? "CoreXManagement/topograph";
const CURRENT = process.env.APP_VERSION ?? "dev";

function extractSha(version: string): string | null {
  return version.startsWith("sha-") ? version.slice(4) : null;
}

async function ghFetch(url: string) {
  return fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "topograph-updater",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
    next: { revalidate: 300 },
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const user    = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (CURRENT === "dev") {
    return NextResponse.json({ hasUpdate: false, current: "dev", mode: "dev" });
  }

  const currentSha = extractSha(CURRENT);

  try {
    // 1. Neuester Commit auf main
    const commitRes = await ghFetch(`https://api.github.com/repos/${REPO}/commits/main`);
    if (!commitRes.ok) return NextResponse.json({ hasUpdate: false, current: CURRENT });

    const commit      = await commitRes.json();
    const latestSha   = (commit.sha as string).slice(0, 7);
    const latestFull  = commit.sha as string;
    const hasUpdate   = currentSha ? latestSha !== currentSha : false;

    // 2. Commits zwischen aktueller und neuer Version (für Changelog)
    let commits: { sha: string; message: string; author: string; date: string }[] = [];
    if (hasUpdate && currentSha) {
      try {
        const compareRes = await ghFetch(
          `https://api.github.com/repos/${REPO}/compare/${currentSha}...${latestFull}`
        );
        if (compareRes.ok) {
          const compareData = await compareRes.json();
          commits = (compareData.commits ?? []).reverse().map((c: {
            sha: string;
            commit: { message: string; author?: { name?: string; date?: string } };
          }) => ({
            sha:     c.sha.slice(0, 7),
            message: (c.commit.message ?? "").split("\n")[0].slice(0, 120),
            author:  c.commit.author?.name ?? "",
            date:    c.commit.author?.date ?? "",
          }));
        }
      } catch { /* compare kann fehlschlagen wenn SHA zu alt */ }
    }

    // 3. Neuesten GitHub Release (für formatierte Release-Notes)
    let releaseNotes = "";
    let releaseUrl   = `https://github.com/${REPO}/commits/main`;
    let publishedAt: string | null = null;
    try {
      const relRes = await ghFetch(`https://api.github.com/repos/${REPO}/releases/latest`);
      if (relRes.ok) {
        const rel    = await relRes.json();
        releaseNotes = rel.body ?? "";
        releaseUrl   = rel.html_url ?? releaseUrl;
        publishedAt  = rel.published_at ?? null;
      }
    } catch { /* kein Release vorhanden */ }

    return NextResponse.json({
      mode:        "sha",
      current:     CURRENT,
      currentSha,
      latest:      `sha-${latestSha}`,
      latestSha,
      hasUpdate,
      commits,
      releaseNotes,
      releaseUrl,
      publishedAt,
    });
  } catch (e) {
    console.error("[update-check]", e);
    return NextResponse.json({ hasUpdate: false, current: CURRENT });
  }
}
