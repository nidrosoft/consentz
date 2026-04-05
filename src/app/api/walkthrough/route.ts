import { z } from "zod";
import { withAuth } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getDb } from "@/lib/db";

const DEFAULT_PROGRESS = {
  phase1Status: "NOT_STARTED",
  phase1CurrentStep: 0,
  phasesCompleted: [] as number[],
  dismissedTips: [] as string[],
  completedFlows: [] as string[],
  checklistCompleted: [] as string[],
  checklistDismissed: false,
};

export const GET = withAuth(async (_req, { auth }) => {
  try {
    const db = await getDb();
    const { data: row, error } = await db
      .from("walkthrough_progress")
      .select("*")
      .eq("user_id", auth.userId)
      .eq("organization_id", auth.organizationId)
      .maybeSingle();

    if (error || !row) {
      return apiSuccess(DEFAULT_PROGRESS);
    }

    return apiSuccess({
      phase1Status: row.phase_1_status ?? "NOT_STARTED",
      phase1CurrentStep: row.phase_1_current_step ?? 0,
      phasesCompleted: row.phases_completed ?? [],
      dismissedTips: row.dismissed_tips ?? [],
      completedFlows: row.completed_flows ?? [],
      checklistCompleted: row.checklist_completed ?? [],
      checklistDismissed: row.checklist_dismissed ?? false,
    });
  } catch {
    return apiSuccess(DEFAULT_PROGRESS);
  }
});

const updateSchema = z.object({
  phase1Status: z.enum(["NOT_STARTED", "IN_PROGRESS", "PAUSED", "COMPLETED", "SKIPPED"]).optional(),
  phase1CurrentStep: z.number().int().min(0).optional(),
  phasesCompleted: z.array(z.number()).optional(),
  dismissedTips: z.array(z.string()).optional(),
  completedFlows: z.array(z.string()).optional(),
  checklistCompleted: z.array(z.string()).optional(),
  checklistDismissed: z.boolean().optional(),
});

export const PATCH = withAuth(async (req, { auth }) => {
  const body = await req.json();
  const validated = updateSchema.parse(body);

  try {
    const db = await getDb();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (validated.phase1Status !== undefined) updates.phase_1_status = validated.phase1Status;
    if (validated.phase1CurrentStep !== undefined) updates.phase_1_current_step = validated.phase1CurrentStep;
    if (validated.phasesCompleted !== undefined) updates.phases_completed = validated.phasesCompleted;
    if (validated.dismissedTips !== undefined) updates.dismissed_tips = validated.dismissedTips;
    if (validated.completedFlows !== undefined) updates.completed_flows = validated.completedFlows;
    if (validated.checklistCompleted !== undefined) updates.checklist_completed = validated.checklistCompleted;
    if (validated.checklistDismissed !== undefined) updates.checklist_dismissed = validated.checklistDismissed;

    if (validated.phase1Status === "COMPLETED") {
      updates.phase_1_completed_at = new Date().toISOString();
    }

    const { data: existing } = await db
      .from("walkthrough_progress")
      .select("id")
      .eq("user_id", auth.userId)
      .eq("organization_id", auth.organizationId)
      .maybeSingle();

    if (existing) {
      await db.from("walkthrough_progress").update(updates).eq("id", existing.id);
    } else {
      await db.from("walkthrough_progress").insert({
        user_id: auth.userId,
        organization_id: auth.organizationId,
        ...updates,
      });
    }
  } catch {
    // Table may not exist yet; progress is saved in localStorage as fallback
  }

  return apiSuccess({ updated: true });
});
