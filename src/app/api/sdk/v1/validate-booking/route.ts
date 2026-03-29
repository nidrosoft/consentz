import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

function getSdkDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
}

export async function POST(req: NextRequest) {
    const client = getSdkDb();
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let resolvedOrgId: string | null = null;

    // Check env var first (backwards compatible)
    if (process.env.CONSENTZ_SDK_API_KEY && apiKey === process.env.CONSENTZ_SDK_API_KEY) {
        // Valid via env var — proceed
    } else {
        // Check DB
        const keyHash = createHash("sha256").update(apiKey).digest("hex");
        const { data: keyRecord } = await client
            .from("sdk_api_keys")
            .select("id, organization_id")
            .eq("key_hash", keyHash)
            .eq("status", "ACTIVE")
            .maybeSingle();

        if (!keyRecord) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Update last_used_at
        await client
            .from("sdk_api_keys")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", keyRecord.id);

        resolvedOrgId = keyRecord.organization_id;
    }

    const body = (await req.json()) as {
        orgId?: string;
        practitionerId?: string;
        treatmentId?: string;
    };
    const orgId = body.orgId || resolvedOrgId;

    if (!orgId) {
        return Response.json({ error: "orgId required" }, { status: 400 });
    }

    const warnings: string[] = [];
    let allowed = true;

    const { count: criticalGaps } = await client.from('compliance_gaps')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('severity', 'CRITICAL')
        .eq('status', 'OPEN');

    if ((criticalGaps ?? 0) > 0) {
        warnings.push(`${criticalGaps} critical compliance gap(s) unresolved`);
    }

    const { count: overdueTasks } = await client.from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .neq('status', 'COMPLETED')
        .eq('priority', 'CRITICAL')
        .lt('due_date', new Date().toISOString());

    if ((overdueTasks ?? 0) > 0) {
        warnings.push(`${overdueTasks} overdue critical task(s)`);
    }

    const { data: score } = await client.from('compliance_scores')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();

    if (score && score.score < 39) {
        allowed = false;
        warnings.push("Compliance score below Inadequate threshold (39%)");
    }

    return Response.json({
        allowed,
        warnings,
        complianceScore: score ? Math.round(score.score) : null,
        rating: score?.predicted_rating ?? null,
    });
}
