import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { role, password } = await req.json();

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(`UPDATE tg_users SET password_hash = $1 WHERE id = $2`, [hash, id]);
  }
  if (role) {
    await pool.query(`UPDATE tg_users SET role = $1 WHERE id = $2`, [role === "ADMIN" ? "ADMIN" : "MEMBER", id]);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const self = session?.user as { id?: string; role?: string } | undefined;
  if (!session || self?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (id === self?.id) return NextResponse.json({ error: "Eigenen Account nicht löschbar" }, { status: 400 });
  await pool.query(`DELETE FROM tg_users WHERE id = $1`, [id]);
  return new NextResponse(null, { status: 204 });
}
