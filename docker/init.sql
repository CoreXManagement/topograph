-- Demo user for local development
-- Password: demo1234 (bcrypt hash)
CREATE TABLE IF NOT EXISTS "User" (
  id           TEXT PRIMARY KEY,
  email        TEXT UNIQUE NOT NULL,
  name         TEXT,
  "passwordHash" TEXT,
  role         TEXT DEFAULT 'ADMIN'
);

INSERT INTO "User" (id, email, name, "passwordHash", role)
VALUES (
  'demo-user-001',
  'demo@corexmanagement.de',
  'Demo User',
  '$2a$10$oIxpb.Vo/tsdTR8QG0f4K.PaXAE5tFvdXOineMAEp/LKvqxz7mg/G',
  'ADMIN'
) ON CONFLICT (email) DO NOTHING;
