import { randomBytes, createHash } from "node:crypto";

import { withAuth } from "@/lib/api-handler";
import { apiSuccess, ApiErrors } from "@/lib/api-response";
import { requireMinRole } from "@/lib/auth";
import { getDb } from "@/lib/db";

// =============================================================================
// DELETE /api/sdk/keys/[id] — Revoke an API key
// =============================================================================

export const DELETE = withAuth(async (_req, { params, auth }) => {
    requireMinRole(auth, "ADMIN");

    const { id } = params;
    const db = await getDb();

    const { data: updated, error } = await db
        .from("sdk_api_keys")
        .update({ status: "REVOKED", revoked_at: new Date().toISOString() })
        .eq("id", id)
        .eq("organization_id", auth.organizationId)
        .select("id")
        .single();

    if (error || !updated) {
        return ApiErrors.notFound("API key");
    }

    return apiSuccess({ id: updated.id, status: "REVOKED" });
});

// =============================================================================
// PATCH /api/sdk/keys/[id] — Rotate an API key (revoke old, create new)
// =============================================================================

export const PATCH = withAuth(async (_req, { params, auth }) => {
    requireMinRole(auth, "ADMIN");

    const { id } = params;
    const db = await getDb();

    // 1. Fetch the existing key to get its name
    const { data: existing, error: fetchError } = await db
        .from("sdk_api_keys")
        .select("id, name, organization_id")
        .eq("id", id)
        .eq("organization_id", auth.organizationId)
        .single();

    if (fetchError || !existing) {
        return ApiErrors.notFound("API key");
    }

    // 2. Revoke the old key
    const { error: revokeError } = await db
        .from("sdk_api_keys")
        .update({ status: "REVOKED", revoked_at: new Date().toISOString() })
        .eq("id", id);

    if (revokeError) {
        console.error("[sdk/keys] Failed to revoke key during rotation:", revokeError);
        return ApiErrors.internal();
    }

    // 3. Generate a new key with the same name
    const fullKey = `cqc_live_${randomBytes(32).toString("hex")}`;
    const keyPrefix = fullKey.slice(0, 12);
    const keyHash = createHash("sha256").update(fullKey).digest("hex");

    const { data: inserted, error: insertError } = await db
        .from("sdk_api_keys")
        .insert({
            organization_id: auth.organizationId,
            name: existing.name,
            key_prefix: keyPrefix,
            key_hash: keyHash,
            status: "ACTIVE",
            created_by: auth.dbUserId,
        })
        .select("id, name, key_prefix, created_at")
        .single();

    if (insertError) {
        console.error("[sdk/keys] Failed to create rotated key:", insertError);
        return ApiErrors.internal();
    }

    // 4. Return the new full key
    return apiSuccess(
        {
            id: inserted.id,
            name: inserted.name,
            key: fullKey,
            key_prefix: inserted.key_prefix,
            created_at: inserted.created_at,
            rotated_from: id,
        },
        undefined,
        201,
    );
});
