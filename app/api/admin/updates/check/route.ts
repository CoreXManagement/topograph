import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const REPO = process.env.UPDATE_REPO ?? "your-org/topograph";
const CURRENT_VERSION = process.env.APP_VERSION ?? "1.0.0";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return NextResponse.json({ hasUpdate: false, current: CURRENT_VERSION });

    const release = await res.json();
    const latest  = release.tag_name?.replace(/^v/, "") ?? CURRENT_VERSION;
    const hasUpdate = latest !== CURRENT_VERSION && latest > CURRENT_VERSION;

    return NextResponse.json({
      current: CURRENT_VERSION,
      latest,
      hasUpdate,
      releaseUrl: release.html_url,
      changelog: release.body?.slice(0, 500) ?? "",
    });
  } catch {
    return NextResponse.json({ hasUpdate: false, current: CURRENT_VERSION });
  }
}
