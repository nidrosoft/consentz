"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, Loader2 } from "lucide-react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const origin = window.location.origin;
            const supabase = createBrowserSupabaseClient();
            const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`,
            });

            if (resetErr) {
                if (process.env.NODE_ENV === "development") console.error("[ForgotPassword]", resetErr);
                setError(resetErr.message || "Could not send reset email.");
                return;
            }

            setSent(true);
        } catch (err) {
            if (process.env.NODE_ENV === "development") console.error("[ForgotPassword]", err);
            setError("Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <>
                <div className="flex flex-col gap-2 lg:gap-3">
                    <h1 className="text-display-xs font-semibold text-primary md:text-display-md">Check your email</h1>
                    <p className="text-md text-tertiary">
                        If an account exists for <span className="font-medium text-secondary">{email}</span>, we sent a link
                        to reset your password. The link expires after a short time.
                    </p>
                </div>
                <Link href="/sign-in" className="text-sm font-semibold text-brand-secondary hover:text-brand-primary">
                    Back to sign in
                </Link>
            </>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-2 lg:gap-3">
                <h1 className="text-display-xs font-semibold text-primary md:text-display-md">Forgot password</h1>
                <p className="text-md text-tertiary">Enter your email and we&apos;ll send you a reset link.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {error && (
                    <div className="rounded-lg bg-error-secondary px-4 py-3">
                        <p className="text-sm text-error-primary">{error}</p>
                    </div>
                )}

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-secondary">
                        Email address
                    </label>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-fg-quaternary" />
                        <input
                            id="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full rounded-lg bg-secondary py-2.5 pl-11 pr-3.5 text-md text-primary outline-none ring-1 ring-primary ring-inset placeholder:text-placeholder transition duration-100 focus:ring-2 focus:ring-brand shadow-xs"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-solid py-2.5 text-md font-semibold text-white shadow-xs transition duration-100 hover:bg-brand-solid_hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? <Loader2 className="size-5 animate-spin" /> : null}
                    {loading ? "Sending…" : "Send reset link"}
                    {!loading && <ArrowRight className="size-4" />}
                </button>
            </form>

            <div className="flex justify-center gap-1 text-center">
                <Link href="/sign-in" className="text-sm font-semibold text-brand-secondary hover:text-brand-primary">
                    Back to sign in
                </Link>
            </div>
        </>
    );
}
