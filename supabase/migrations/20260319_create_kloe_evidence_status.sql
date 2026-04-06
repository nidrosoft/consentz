-- Track per-organisation evidence item completion for each KLOE
CREATE TABLE IF NOT EXISTS kloe_evidence_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  kloe_code TEXT NOT NULL,
  evidence_item_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'complete')) DEFAULT 'not_started',
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('POLICY', 'MANUAL_UPLOAD', 'CONSENTZ', 'CONSENTZ_MANUAL')),
  linked_policy_id UUID,
  linked_evidence_id UUID,
  consentz_synced_at TIMESTAMPTZ,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, evidence_item_id)
);

CREATE INDEX IF NOT EXISTS idx_kloe_evidence_org ON kloe_evidence_status(organization_id);
CREATE INDEX IF NOT EXISTS idx_kloe_evidence_kloe ON kloe_evidence_status(organization_id, kloe_code);
CREATE INDEX IF NOT EXISTS idx_kloe_evidence_status ON kloe_evidence_status(organization_id, status);
