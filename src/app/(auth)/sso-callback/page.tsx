import { redirect } from "next/navigation";

/** Legacy Clerk OAuth callback — authentication is Supabase-only now. */
export default function SsoCallbackPage() {
    redirect("/sign-in");
}
