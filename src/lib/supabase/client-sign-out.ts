"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/** Ends the Supabase session and hard-navigates so bfcache/back cannot restore an authenticated shell. */
export async function signOutEverywhere(): Promise<void> {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut({ scope: "global" });
    if (typeof window !== "undefined") {
        window.location.replace("/sign-in");
    }
}
