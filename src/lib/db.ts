import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

function hasServiceRoleKey(): boolean {
    return !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function getAdminClient(): SupabaseClient {
    if (adminClient) return adminClient;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");
    adminClient = createClient(url, key);
    return adminClient;
}

/**
 * Returns a Supabase client for database queries. Uses service-role admin
 * client when available. Falls back to the request-scoped server client
 * (authenticated via cookies) otherwise.
 */
export async function getDb(): Promise<SupabaseClient> {
    if (hasServiceRoleKey()) return getAdminClient();
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    return createServerSupabaseClient();
}

/**
 * Synchronous Supabase admin client proxy. When the service-role key is set,
 * this bypasses RLS. When it's missing, it falls back to anon key — prefer
 * `getDb()` in API routes for proper auth context.
 */
export const db = new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
        if (hasServiceRoleKey()) {
            return Reflect.get(getAdminClient(), prop, receiver);
        }
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) throw new Error("Supabase URL and anon key required.");
        if (!adminClient) {
            console.warn("[db] Service role key missing — falling back to anon key. Some operations may fail.");
            adminClient = createClient(url, key);
        }
        return Reflect.get(adminClient, prop, receiver);
    },
});
