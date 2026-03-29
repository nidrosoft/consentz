-- ============================================================================
-- Supabase Row-Level Security (defence-in-depth for direct Supabase client use).
-- Prisma uses the service role and bypasses RLS; apply this migration in Supabase SQL.
-- Physical table names match Prisma @@map (snake_case).
-- ============================================================================

-- Enable RLS on all user-data tables
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assessments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assessment_responses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "compliance_scores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "domain_scores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "compliance_gaps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "evidence_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "staff_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "training_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "incidents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activity_logs" ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (for Prisma backend)
-- This is the default in Supabase, but be explicit:
ALTER TABLE "organizations" FORCE ROW LEVEL SECURITY;

-- Policies: users can only access their own organization's data
-- auth.uid() returns the Supabase auth user ID; join via users.supabase_user_id

CREATE POLICY "Users can view own org" ON "organizations"
  FOR SELECT USING (
    id IN (SELECT organization_id FROM users WHERE supabase_user_id = auth.uid())
  );

CREATE POLICY "Org-scoped select" ON "users"
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE supabase_user_id = auth.uid())
    OR supabase_user_id = auth.uid()
  );

CREATE POLICY "Org-scoped select" ON "assessments"
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE supabase_user_id = auth.uid())
  );

CREATE POLICY "Org-scoped select" ON "assessment_responses"
  FOR SELECT USING (
    (SELECT a.organization_id FROM assessments a WHERE a.id = assessment_responses.assessment_id)
    IN (SELECT organization_id FROM users WHERE supabase_user_id = auth.uid())
  );

CREATE POLICY "Org-scoped select" ON "compliance_scores"
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE supabase_user_id = auth.uid())
  );

CREATE POLICY "Org-scoped select" ON "domain_scores"
  FOR SELECT USING (
    (SELECT cs.organization_id FROM compliance_scores cs WHERE cs.id = domain_scores.compliance_score_id)
    IN (SELECT organization_id FROM users WHERE supabase_user_id = auth.uid())
  );

CREATE POLICY "Org-scoped select" ON "compliance_gaps"
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE supabase_user_id = auth.uid())
  );

CREATE POLICY "Org-scoped select" ON "evidence_items"
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE supabase_user_id = auth.uid())
  );

CREATE POLICY "Org-scoped select" ON "policies"
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE supabase_user_id = auth.uid())
  );

CREATE POLICY "Org-scoped select" ON "staff_members"
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE supabase_user_id = auth.uid())
  );

CREATE POLICY "Org-scoped select" ON "training_records"
  FOR SELECT USING (
    (SELECT sm.organization_id FROM staff_members sm WHERE sm.id = training_records.staff_member_id)
    IN (SELECT organization_id FROM users WHERE supabase_user_id = auth.uid())
  );

CREATE POLICY "Org-scoped select" ON "incidents"
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE supabase_user_id = auth.uid())
  );

CREATE POLICY "Org-scoped select" ON "tasks"
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE supabase_user_id = auth.uid())
  );

CREATE POLICY "Org-scoped select" ON "notifications"
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE supabase_user_id = auth.uid())
  );

CREATE POLICY "Org-scoped select" ON "activity_logs"
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE supabase_user_id = auth.uid())
  );
