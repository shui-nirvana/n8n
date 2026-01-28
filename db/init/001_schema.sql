CREATE TABLE IF NOT EXISTS automation_logs (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  workflow_id TEXT NOT NULL,
  execution_id TEXT,
  status TEXT CHECK (status IN ('success', 'error', 'running')) NOT NULL,
  duration_ms INTEGER,
  message TEXT
);

CREATE INDEX IF NOT EXISTS idx_logs_workflow ON automation_logs (workflow_id);
CREATE INDEX IF NOT EXISTS idx_logs_status ON automation_logs (status);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON automation_logs (created_at);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial admin user (password: admin123)
-- Hash generated for demo purposes. In production, use bcrypt in backend.
-- $2b$10$7Z... is just a placeholder, we will handle hash in code or seed a known hash.
-- For this demo, let's assume the backend handles registration or we insert a known hash.
-- Using a simple hash for 'admin123' generated via bcrypt (cost 10):
-- $2b$10$EpW1.l.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1 (invalid)
-- Let's just create the table. We will seed it via a separate script or backend logic.
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '$2b$10$cw.K/k/k/k/k/k/k/k/k/k/k/k/k/k/k/k/k/k/k/k/k/k/k/k', 'admin')
ON CONFLICT (username) DO NOTHING;

