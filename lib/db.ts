import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

export default pool;

export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tg_users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email         TEXT UNIQUE NOT NULL,
      name          TEXT,
      password_hash TEXT,
      role          TEXT NOT NULL DEFAULT 'MEMBER',
      auth_source   TEXT NOT NULL DEFAULT 'local',
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      last_login    TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS docs_diagrams (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title       TEXT NOT NULL,
      description TEXT,
      created_by  UUID REFERENCES tg_users(id) ON DELETE SET NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS docs_nodes (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      diagram_id    UUID NOT NULL REFERENCES docs_diagrams(id) ON DELETE CASCADE,
      label         TEXT NOT NULL DEFAULT 'Node',
      node_type     TEXT NOT NULL DEFAULT 'SERVICE',
      ip_address    TEXT,
      port          TEXT,
      description   TEXT,
      custom_fields JSONB DEFAULT '[]',
      position_x    DOUBLE PRECISION DEFAULT 0,
      position_y    DOUBLE PRECISION DEFAULT 0,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS docs_edges (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      diagram_id UUID NOT NULL REFERENCES docs_diagrams(id) ON DELETE CASCADE,
      source_id  UUID NOT NULL,
      target_id  UUID NOT NULL,
      label      TEXT,
      edge_type  TEXT DEFAULT 'solid',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS docs_node_notes (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      node_id    UUID NOT NULL REFERENCES docs_nodes(id) ON DELETE CASCADE,
      content    TEXT NOT NULL,
      created_by UUID REFERENCES tg_users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_docs_nodes_diagram ON docs_nodes(diagram_id);
    CREATE INDEX IF NOT EXISTS idx_docs_edges_diagram ON docs_edges(diagram_id);
    CREATE INDEX IF NOT EXISTS idx_docs_notes_node    ON docs_node_notes(node_id);

    CREATE TABLE IF NOT EXISTS tg_settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    INSERT INTO tg_settings (key, value) VALUES
      ('allow_registration',      'false'),
      ('app_name',                'Topograph'),
      ('smtp_host',               ''),
      ('smtp_port',               '587'),
      ('smtp_secure',             'false'),
      ('smtp_user',               ''),
      ('smtp_password',           ''),
      ('smtp_from',               ''),
      ('smtp_from_name',          'Topograph'),
      ('email_welcome',           'false'),
      ('email_reset_expiry_min',  '60'),
      ('ldap_enabled',            'false'),
      ('ldap_url',                ''),
      ('ldap_domain',             ''),
      ('ldap_base_dn',            ''),
      ('ldap_group_dn',           ''),
      ('ldap_bind_dn',            ''),
      ('ldap_bind_password',      ''),
      ('ldap_ca_cert',            '')
    ON CONFLICT (key) DO NOTHING;

    CREATE TABLE IF NOT EXISTS tg_password_resets (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email      TEXT NOT NULL,
      token      TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used       BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_pw_resets_token ON tg_password_resets(token);
    CREATE INDEX IF NOT EXISTS idx_pw_resets_email ON tg_password_resets(email);
  `);
  await pool.query(`ALTER TABLE docs_nodes ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]';`);
}

let initialized = false;
export async function ensureSchema() {
  if (!initialized) { await initSchema(); initialized = true; }
}

export async function getSetting(key: string): Promise<string | null> {
  const { rows } = await pool.query(`SELECT value FROM tg_settings WHERE key = $1`, [key]);
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await pool.query(
    `INSERT INTO tg_settings (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, value]
  );
}

export async function userCount(): Promise<number> {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM tg_users`);
  return rows[0]?.n ?? 0;
}
