import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendMail, testMail } from "@/lib/mail";
import { getSetting } from "@/lib/db";

export async function POST() {
  const session = await getServerSession(authOptions);
  const user    = session?.user as { role?: string; email?: string | null } | undefined;
  if (!session || user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const appName = (await getSetting("app_name")) ?? "Topograph";
  const to      = user.email!;

  const result = await sendMail(to, `${appName} — Test-E-Mail`, testMail(appName));

  if (!result.sent) {
    return NextResponse.json({ error: result.reason ?? "SMTP nicht konfiguriert" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, to });
}
