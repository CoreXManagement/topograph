import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool, { ensureSchema, getSetting } from "@/lib/db";
import { sendMail, welcomeMail } from "@/lib/mail";

export async function GET() {
  await ensureSchema();
  const allowed = await getSetting("allow_registration");
  return NextResponse.json({ allowed: allowed === "true" });
}

export async function POST(req: Request) {
  await ensureSchema();

  const allowed = await getSetting("allow_registration");
  if (allowed !== "true") {
    return NextResponse.json({ error: "Registrierung ist deaktiviert." }, { status: 403 });
  }

  const { name, email, password } = await req.json();
  if (!email?.trim() || !password || password.length < 8) {
    return NextResponse.json(
      { error: "E-Mail und Passwort (min. 8 Zeichen) erforderlich." },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO tg_users (email, name, password_hash, role)
     VALUES ($1, $2, $3, 'MEMBER')
     ON CONFLICT (email) DO NOTHING
     RETURNING id, email, name, role`,
    [email.toLowerCase().trim(), name?.trim() || null, hash]
  );

  if (!rows[0]) {
    return NextResponse.json({ error: "E-Mail ist bereits vergeben." }, { status: 409 });
  }

  // Willkommens-E-Mail (optional, nur wenn Einstellung aktiv)
  const welcomeEnabled = await getSetting("email_welcome");
  if (welcomeEnabled === "true") {
    const appName  = (await getSetting("app_name")) ?? "Topograph";
    const loginUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/login`;
    sendMail(rows[0].email, `Willkommen bei ${appName}`, welcomeMail(rows[0].name, loginUrl, appName))
      .catch(() => {}); // fire-and-forget, kein Fehler wenn SMTP nicht konfiguriert
  }

  return NextResponse.json(rows[0], { status: 201 });
}
