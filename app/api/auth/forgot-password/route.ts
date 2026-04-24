import { NextResponse } from "next/server";
import crypto from "crypto";
import pool, { ensureSchema, getSetting } from "@/lib/db";
import { sendMail, passwordResetMail } from "@/lib/mail";

export async function POST(req: Request) {
  await ensureSchema();
  const { email } = await req.json();
  if (!email?.trim()) return NextResponse.json({ ok: true }); // keine Info ob E-Mail existiert

  const { rows } = await pool.query(
    `SELECT id, email, name FROM tg_users WHERE email = $1 AND auth_source = 'local' LIMIT 1`,
    [email.toLowerCase().trim()]
  );
  // Immer ok zurückgeben – verhindert User-Enumeration
  if (!rows[0]) return NextResponse.json({ ok: true });

  const user    = rows[0];
  const token   = crypto.randomBytes(32).toString("hex");
  const expiry  = parseInt((await getSetting("email_reset_expiry_min")) ?? "60", 10);
  const appName = (await getSetting("app_name")) ?? "Topograph";

  await pool.query(
    `INSERT INTO tg_password_resets (email, token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '1 minute' * $3)`,
    [user.email, token, expiry]
  );

  const baseUrl  = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await sendMail(
    user.email,
    `${appName} — Passwort zurücksetzen`,
    passwordResetMail(resetUrl, expiry, appName)
  );

  return NextResponse.json({ ok: true });
}
