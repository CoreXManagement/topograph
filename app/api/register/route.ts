import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool, { ensureSchema, getSetting } from "@/lib/db";

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

  return NextResponse.json(rows[0], { status: 201 });
}
