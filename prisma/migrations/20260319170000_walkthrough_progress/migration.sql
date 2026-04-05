-- CreateTable: walkthrough_progress
-- Tracks first-time user walkthrough and in-app guidance progress

CREATE TABLE IF NOT EXISTS walkthrough_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Phase 1 (Welcome & Orientation) tracking
  phase_1_status TEXT DEFAULT 'NOT_STARTED'
    CHECK (phase_1_status IN ('NOT_STARTED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'SKIPPED')),
  phase_1_current_step INTEGER DEFAULT 0,
  phase_1_completed_at TIMESTAMPTZ,

  -- Page-level tours completed
  phases_completed JSONB DEFAULT '[]',
  phases_in_progress JSONB DEFAULT '{}',

  -- Micro-tips dismissed
  dismissed_tips JSONB DEFAULT '[]',

  -- Guided action flows completed
  completed_flows JSONB DEFAULT '[]',

  -- Onboarding checklist
  checklist_completed JSONB DEFAULT '[]',
  checklist_dismissed BOOLEAN DEFAULT FALSE,

  -- Help widget
  help_widget_opened BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, organization_id)
);

CREATE INDEX idx_walkthrough_user_org ON walkthrough_progress(user_id, organization_id);
