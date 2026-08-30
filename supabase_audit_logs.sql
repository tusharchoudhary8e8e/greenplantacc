-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: AUDIT TRAIL LOGGING TABLE & ROW-LEVEL SECURITY
-- Forensic Record of all financial edits, cancellations, and bank adjustments
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ma_audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT DEFAULT 'admin',
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_label TEXT,
  action TEXT NOT NULL,
  changes_summary TEXT,
  previous_state JSONB,
  new_state JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast audit queries by entity and timestamp
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON ma_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON ma_audit_logs(entity_type, entity_id);

ALTER TABLE ma_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view audit logs
CREATE POLICY "Allow authenticated users to view audit logs"
  ON ma_audit_logs FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert audit trail records
CREATE POLICY "Allow authenticated users to insert audit logs"
  ON ma_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
