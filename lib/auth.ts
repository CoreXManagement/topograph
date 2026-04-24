import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import pool from "./db";
import { ldapAuthenticate } from "./ldap";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "E-Mail",   type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toLowerCase().trim();

        // 1. Lokaler Login (Passwort in DB)
        const { rows } = await pool.query<{
          id: string; email: string; name: string | null;
          password_hash: string | null; role: string; auth_source: string;
        }>(
          `SELECT id, email, name, password_hash, role, auth_source
           FROM tg_users WHERE email = $1 LIMIT 1`,
          [email]
        );
        const user = rows[0];

        if (user?.auth_source === "local" && user.password_hash) {
          const valid = await bcrypt.compare(credentials.password, user.password_hash);
          if (!valid) return null;
          await pool.query(`UPDATE tg_users SET last_login = NOW() WHERE id = $1`, [user.id]);
          return { id: user.id, email: user.email, name: user.name ?? user.email, role: user.role };
        }

        // 2. LDAP / AD — Konfiguration aus DB (Admin-UI)
        const ldapUser = await ldapAuthenticate(email, credentials.password);
        if (ldapUser) {
          const { rows: upserted } = await pool.query<{ id: string; role: string }>(
            `INSERT INTO tg_users (email, name, role, auth_source)
             VALUES ($1, $2, 'MEMBER', 'ldap')
             ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, last_login = NOW()
             RETURNING id, role`,
            [ldapUser.email, ldapUser.name]
          );
          const u = upserted[0];
          if (!u) return null;
          return { id: u.id, email: ldapUser.email, name: ldapUser.name, role: u.role };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: string }).id   = token.id as string;
        (session.user as { id?: string; role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
