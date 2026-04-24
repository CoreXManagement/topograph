import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import pool, { ensureSchema } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureSchema();
  const { rows } = await pool.query(
    `SELECT id, email, name, role, auth_source, created_at, last_login FROM tg_users ORDER BY created_at`
  );
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureSchema();

  const { email, name, password, role } = await req.json();
  if (!email?.trim() || !password) return NextResponse.json({ error: "E-Mail und Passwort erforderlich" }, { status: 400 });

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO tg_users (email, name, password_hash, role) VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING RETURNING id, email, name, role`,
    [email.toLowerCase().trim(), name?.trim() || null, hash, role === "ADMIN" ? "ADMIN" : "MEMBER"]
  );
  if (!rows[0]) return NextResponse.json({ error: "E-Mail bereits vergeben" }, { status: 409 });
  return NextResponse.json(rows[0], { status: 201 });
}
