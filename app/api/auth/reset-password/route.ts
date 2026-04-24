import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool, { ensureSchema } from "@/lib/db";

export async function POST(req: Request) {
  await ensureSchema();
  const { token, password } = await req.json();

  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: "Token und Passwort (min. 8 Zeichen) erforderlich." }, { status: 400 });
  }

  const { rows } = await pool.query(
    `SELECT id, email FROM tg_password_resets
     WHERE token = $1 AND used = FALSE AND expires_at > NOW()
     LIMIT 1`,
    [token]
  );
  if (!rows[0]) {
    return NextResponse.json({ error: "Token ungültig oder abgelaufen." }, { status: 400 });
  }

  const reset = rows[0];
  const hash  = await bcrypt.hash(password, 10);

  await pool.query(`UPDATE tg_users SET password_hash = $1 WHERE email = $2`, [hash, reset.email]);
  await pool.query(`UPDATE tg_password_resets SET used = TRUE WHERE id = $1`, [reset.id]);

  return NextResponse.json({ ok: true });
}
