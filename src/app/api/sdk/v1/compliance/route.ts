import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

function getSdkDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
}

export async function GET(req: NextRequest) {
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

    const orgId = req.nextUrl.searchParams.get("orgId") || resolvedOrgId;
    if (!orgId) {
        return Response.json({ error: "orgId required" }, { status: 400 });
    }

    const { data: score } = await client.from('compliance_scores')
        .select('*, domain_scores(*)')
        .eq('organization_id', orgId)
        .maybeSingle();

    if (!score) {
        return Response.json({ error: "Organization not found" }, { status: 404 });
    }

    const { data: gaps } = await client.from('compliance_gaps')
        .select('id, title, severity, domain, status')
        .eq('organization_id', orgId)
        .in('status', ['OPEN', 'IN_PROGRESS'])
        .order('created_at', { ascending: false })
        .limit(10);

    return Response.json({
        overallScore: Math.round(score.score),
        rating: score.predicted_rating,
        calculatedAt: score.calculated_at,
        domains: ((score.domain_scores ?? []) as any[]).map((d) => ({
            domain: d.domain,
            score: Math.round(d.score),
            rating: d.status,
            gaps: d.total_gaps,
        })),
        alerts: (gaps ?? []).map((g) => ({
            id: g.id,
            title: g.title,
            severity: g.severity,
            domain: g.domain,
        })),
    });
}
