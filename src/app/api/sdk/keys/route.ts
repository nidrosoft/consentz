import { randomBytes, createHash } from "node:crypto";

import { withAuth } from "@/lib/api-handler";
import { apiSuccess, ApiErrors } from "@/lib/api-response";
import { requireMinRole } from "@/lib/auth";
import { getDb } from "@/lib/db";

// =============================================================================
// GET /api/sdk/keys — List API keys for the organisation
// =============================================================================

export const GET = withAuth(async (_req, { auth }) => {
    const db = await getDb();

    const { data: keys, error } = await db
        .from("sdk_api_keys")
        .select("id, name, key_prefix, status, created_at, last_used_at, revoked_at")
        .eq("organization_id", auth.organizationId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[sdk/keys] Failed to list keys:", error);
        return ApiErrors.internal();
    }

    return apiSuccess(keys ?? []);
});

// =============================================================================
// POST /api/sdk/keys — Generate a new API key
// =============================================================================

export const POST = withAuth(async (req, { auth }) => {
    requireMinRole(auth, "ADMIN");

    const body = await req.json();
    const name = body.name || "API Key";

    const db = await getDb();

    // Generate a random API key
    const fullKey = `cqc_live_${randomBytes(32).toString("hex")}`;
    const keyPrefix = fullKey.slice(0, 12);
    const keyHash = createHash("sha256").update(fullKey).digest("hex");

    const { data: inserted, error } = await db
        .from("sdk_api_keys")
        .insert({
            organization_id: auth.organizationId,
            name,
            key_prefix: keyPrefix,
            key_hash: keyHash,
            status: "ACTIVE",
            created_by: auth.dbUserId,
        })
        .select("id, name, key_prefix, created_at")
        .single();

    if (error) {
        console.error("[sdk/keys] Failed to create key:", error);
        return ApiErrors.internal();
    }

    // Return the full key — this is the only time it will be shown
    return apiSuccess(
        {
            id: inserted.id,
            name: inserted.name,
            key: fullKey,
            key_prefix: inserted.key_prefix,
            created_at: inserted.created_at,
        },
        undefined,
        201,
    );
});
