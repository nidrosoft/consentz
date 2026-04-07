-- Evidence expiry metadata on KLOE evidence rows, file version history with a single
-- "current" row per item, and tenant-scoped RLS aligned with other org-bound tables.

-- 1) kloe_evidence_status: expiry and activity fields + cached expiry_status
ALTER TABLE kloe_evidence_status
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS expiry_status TEXT NULL
    CHECK (expiry_status IN ('valid', 'expiring_soon', 'expired'));

-- 2) evidence_file_versions: versioned uploads per evidence item
CREATE TABLE IF NOT EXISTS evidence_file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  evidence_item_id TEXT NOT NULL,
  kloe_code TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NULL,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_file_versions_org_item
  ON evidence_file_versions (organization_id, evidence_item_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_file_versions_one_current
  ON evidence_file_versions (organization_id, evidence_item_id)
  WHERE is_current = TRUE;

-- 3) Row level security: only rows in the caller's organization (same pattern as tenant tables)
ALTER TABLE kloe_evidence_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_file_versions ENABLE ROW LEVEL SECURITY;

-- Resolve org from Supabase auth user id (matches application auth: users.supabase_user_id
-- and organization_members.auth_user_id for member-linked sessions).
CREATE POLICY "kloe_evidence_status_tenant_isolation"
  ON kloe_evidence_status
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT u.organization_id
      FROM users u
      WHERE u.supabase_user_id = auth.uid()
        AND u.organization_id IS NOT NULL
      UNION
      SELECT m.organization_id
      FROM organization_members m
      WHERE m.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT u.organization_id
      FROM users u
      WHERE u.supabase_user_id = auth.uid()
        AND u.organization_id IS NOT NULL
      UNION
      SELECT m.organization_id
      FROM organization_members m
      WHERE m.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "evidence_file_versions_tenant_isolation"
  ON evidence_file_versions
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT u.organization_id
      FROM users u
      WHERE u.supabase_user_id = auth.uid()
        AND u.organization_id IS NOT NULL
      UNION
      SELECT m.organization_id
      FROM organization_members m
      WHERE m.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT u.organization_id
      FROM users u
      WHERE u.supabase_user_id = auth.uid()
        AND u.organization_id IS NOT NULL
      UNION
      SELECT m.organization_id
      FROM organization_members m
      WHERE m.auth_user_id = auth.uid()
    )
  );
