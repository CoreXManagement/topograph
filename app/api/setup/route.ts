import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool, { ensureSchema, userCount } from "@/lib/db";

export async function GET() {
  await ensureSchema();
  const count = await userCount();
  return NextResponse.json({ required: count === 0 });
}

export async function POST(req: Request) {
  await ensureSchema();

  if ((await userCount()) > 0) {
    return NextResponse.json({ error: "Setup bereits abgeschlossen." }, { status: 403 });
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
     VALUES ($1, $2, $3, 'ADMIN')
     RETURNING id, email, name, role`,
    [email.toLowerCase().trim(), name?.trim() || null, hash]
  );

  return NextResponse.json(rows[0], { status: 201 });
}
