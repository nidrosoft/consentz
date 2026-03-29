"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, User } from "lucide-react";

import { PASSWORD_REQUIREMENTS, validateStrongPassword } from "@/lib/password-policy";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cx } from "@/utils/cx";

export default function SignUpPage() {
    const router = useRouter();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [awaitingEmail, setAwaitingEmail] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const pw = validateStrongPassword(password);
        if (!pw.ok) {
            setError(pw.message);
            setLoading(false);
            return;
        }

        try {
            const origin = window.location.origin;
            const supabase = createBrowserSupabaseClient();
            const { data, error: signErr } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${origin}/auth/callback?next=/welcome`,
                    data: {
                        first_name: firstName.trim() || null,
                        last_name: lastName.trim() || null,
                    },
                },
            });

            if (signErr) {
                setError(signErr.message || "Could not create account.");
                return;
            }

            if (data.session) {
                try {
                    await fetch("/api/auth/ensure-user", { method: "POST" });
                } catch {
                    // Profile may already exist via database trigger — proceed anyway
                }
                router.refresh();
                router.push("/welcome");
                return;
            }

            setAwaitingEmail(true);
        } catch {
            setError("Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    };

    if (awaitingEmail) {
        return (
            <>
                <div className="flex flex-col gap-2 lg:gap-3">
                    <h1 className="text-display-xs font-semibold text-primary md:text-display-md">Check your email</h1>
                    <p className="text-md text-tertiary">
                        We sent a confirmation link to <span className="font-medium text-secondary">{email}</span>. Open it to
                        finish setting up your account, then you&apos;ll continue to onboarding.
                    </p>
                </div>
                <a href="/sign-in" className="text-sm font-semibold text-brand-secondary hover:text-brand-primary">
                    Back to sign in
                </a>
            </>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-2 lg:gap-3">
                <h1 className="text-display-xs font-semibold text-primary md:text-display-md">Sign up</h1>
                <p className="text-md text-tertiary">Start your CQC compliance journey.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {error && (
                    <div className="rounded-lg bg-error-secondary px-4 py-3">
                        <p className="text-sm text-error-primary">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="firstName" className="text-sm font-medium text-secondary">
                            First name
                        </label>
                        <div className="relative">
                            <User className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-fg-quaternary" />
                            <input
                                id="firstName"
                                type="text"
                                autoComplete="given-name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="First name"
                                className="w-full rounded-lg bg-secondary py-2.5 pl-11 pr-3.5 text-md text-primary outline-none ring-1 ring-primary ring-inset placeholder:text-placeholder transition duration-100 focus:ring-2 focus:ring-brand shadow-xs"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="lastName" className="text-sm font-medium text-secondary">
                            Last name
                        </label>
                        <div className="relative">
                            <User className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-fg-quaternary" />
                            <input
                                id="lastName"
                                type="text"
                                autoComplete="family-name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Last name"
                                className="w-full rounded-lg bg-secondary py-2.5 pl-11 pr-3.5 text-md text-primary outline-none ring-1 ring-primary ring-inset placeholder:text-placeholder transition duration-100 focus:ring-2 focus:ring-brand shadow-xs"
                            />
                        </div>
                    </div>
                </div>

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
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a strong password"
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
                    <ul className="flex flex-col gap-1 text-xs text-tertiary">
                        {PASSWORD_REQUIREMENTS.map((req) => (
                            <li
                                key={req.id}
                                className={cx("flex items-center gap-2", req.test(password) && "text-success-primary")}
                            >
                                <span className="font-medium">{req.test(password) ? "✓" : "○"}</span>
                                {req.label}
                            </li>
                        ))}
                    </ul>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-solid py-2.5 text-md font-semibold text-white shadow-xs transition duration-100 hover:bg-brand-solid_hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? <Loader2 className="size-5 animate-spin" /> : null}
                    {loading ? "Creating account…" : "Create account"}
                    {!loading && <ArrowRight className="size-4" />}
                </button>
            </form>

            <div className="flex justify-center gap-1 text-center">
                <span className="text-sm text-tertiary">Already have an account?</span>
                <a href="/sign-in" className="text-sm font-semibold text-brand-secondary transition duration-100 hover:text-brand-primary">
                    Log in
                </a>
            </div>
        </>
    );
}
