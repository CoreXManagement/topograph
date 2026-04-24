#!/usr/bin/env node
// Ersten Administrator anlegen
// Verwendung: node scripts/create-admin.js <email> <passwort>

const { Client } = require("pg");
const bcrypt = require("bcryptjs");

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Verwendung: node scripts/create-admin.js <email> <passwort>");
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await client.query(
    `INSERT INTO tg_users (email, name, password_hash, role)
     VALUES ($1, $2, $3, 'ADMIN')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'ADMIN'
     RETURNING id, email, role`,
    [email.toLowerCase(), email.split("@")[0], hash]
  );

  console.log("Administrator angelegt:", rows[0]);
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
