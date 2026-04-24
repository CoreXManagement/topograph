import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool, { ensureSchema, getSetting, setSetting } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user    = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await ensureSchema();
  const { rows } = await pool.query(`SELECT key, value FROM tg_settings ORDER BY key`);
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;
  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await ensureSchema();
  const body = await req.json() as Record<string, string>;

  const allowed = [
    "allow_registration", "app_name",
    "smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_password",
    "smtp_from", "smtp_from_name", "email_welcome", "email_reset_expiry_min",
    "ldap_enabled", "ldap_url", "ldap_domain", "ldap_base_dn",
    "ldap_group_dn", "ldap_bind_dn", "ldap_bind_password", "ldap_ca_cert",
  ];
  for (const [key, value] of Object.entries(body)) {
    if (allowed.includes(key)) {
      await setSetting(key, String(value));
    }
  }
  return NextResponse.json({ ok: true });
}
