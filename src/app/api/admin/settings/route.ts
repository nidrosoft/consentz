import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getDb } from "@/lib/db";

export const GET = withAdmin(async () => {
    const db = await getDb();
    const { data } = await db
        .from("platform_settings")
        .select("*")
        .eq("id", "global")
        .single();

    return apiSuccess(data ?? {
        feature_flags: { ai_chat: true, onboarding: true, consentz_sync: true, policy_autogen: true, maintenance_mode: false },
        scoring_weights: { safe: 20, effective: 20, caring: 20, responsive: 20, well_led: 20 },
        sync_frequency_hours: 6,
    });
});

export const PATCH = withAdmin(async (req: NextRequest) => {
    const db = await getDb();
    const body = await req.json();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.feature_flags) updates.feature_flags = body.feature_flags;
    if (body.scoring_weights) updates.scoring_weights = body.scoring_weights;
    if (body.sync_frequency_hours) updates.sync_frequency_hours = body.sync_frequency_hours;

    const { data, error } = await db
        .from("platform_settings")
        .update(updates)
        .eq("id", "global")
        .select()
        .single();

    if (error) {
        return apiSuccess({ error: error.message });
    }

    return apiSuccess(data);
});
