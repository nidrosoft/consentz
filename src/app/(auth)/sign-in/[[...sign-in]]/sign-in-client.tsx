"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function SignInClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") ?? "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        function onPageShow(e: PageTransitionEvent) {
            if (!e.persisted) return;
            void createBrowserSupabaseClient().auth.getSession().then(({ data: { session } }) => {
                if (!session) {
                    window.location.reload();
                }
            });
        }
        window.addEventListener("pageshow", onPageShow);
        return () => window.removeEventListener("pageshow", onPageShow);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const supabase = createBrowserSupabaseClient();
            const { error: signErr } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            if (signErr) {
                if (process.env.NODE_ENV === "development") console.error("[SignIn]", signErr);
                setError(signErr.message || "Invalid email or password.");
                return;
            }

            const ensure = await fetch("/api/auth/ensure-user", { method: "POST" });
            if (!ensure.ok) {
                if (process.env.NODE_ENV === "development") console.error("[SignIn] ensure-user:", ensure.status);
                setError("Signed in but profile sync failed. Try again or contact support.");
                return;
            }

            router.refresh();
            router.push(redirectTo.startsWith("/") ? redirectTo : "/");
        } catch (err) {
            if (process.env.NODE_ENV === "development") console.error("[SignIn]", err);
            setError("Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex flex-col gap-2 lg:gap-3">
                <h1 className="text-display-xs font-semibold text-primary md:text-display-md">Welcome back</h1>
                <p className="text-md text-tertiary">Sign in to your CQC compliance account.</p>
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

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-sm font-medium text-secondary">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-fg-quaternary" />
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full rounded-lg bg-secondary py-2.5 pl-11 pr-11 text-md text-primary outline-none ring-1 ring-primary ring-inset placeholder:text-placeholder transition duration-100 focus:ring-2 focus:ring-brand shadow-xs"
                        />
                        <button
                            type="button"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-quaternary transition duration-100 hover:text-fg-secondary"
                            onClick={() => setShowPassword((v) => !v)}
                        >
                            {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                        </button>
                    </div>
                    <div className="flex justify-end">
                        <a
                            href="/forgot-password"
                            className="text-sm font-semibold text-brand-secondary transition duration-100 hover:text-brand-primary"
                        >
                            Forgot password?
                        </a>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-solid py-2.5 text-md font-semibold text-white shadow-xs transition duration-100 hover:bg-brand-solid_hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? <Loader2 className="size-5 animate-spin" /> : null}
                    {loading ? "Signing in…" : "Continue"}
                    {!loading && <ArrowRight className="size-4" />}
                </button>
            </form>

            <div className="flex justify-center gap-1 text-center">
                <span className="text-sm text-tertiary">Don&apos;t have an account?</span>
                <a href="/sign-up" className="text-sm font-semibold text-brand-secondary transition duration-100 hover:text-brand-primary">
                    Sign up
                </a>
            </div>
        </>
    );
}
