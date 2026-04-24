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
  `);
  await pool.query(`ALTER TABLE docs_nodes ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]';`);
}

let initialized = false;
export async function ensureSchema() {
  if (!initialized) { await initSchema(); initialized = true; }
}
