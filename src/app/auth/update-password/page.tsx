"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Loader2, CheckCircle2 } from "lucide-react";

import { PASSWORD_REQUIREMENTS, validateStrongPassword } from "@/lib/password-policy";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cx } from "@/utils/cx";

export default function UpdatePasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const allRequirementsMet = PASSWORD_REQUIREMENTS.every((req) => req.test(password));
    const passwordsMatch = password.length > 0 && password === confirm;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (password !== confirm) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        const pw = validateStrongPassword(password);
        if (!pw.ok) {
            setError(pw.message);
            setLoading(false);
            return;
        }

        try {
            const supabase = createBrowserSupabaseClient();
            const { error: updErr } = await supabase.auth.updateUser({ password });
            if (updErr) {
                setError(updErr.message || "Could not update password.");
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                router.refresh();
                router.push("/");
            }, 2000);
        } catch (err) {
            console.error("[UpdatePassword] Error:", err);
            setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <>
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-success-secondary">
                        <CheckCircle2 className="size-7 text-fg-success-primary" />
                    </div>
                    <h1 className="text-display-xs font-semibold text-primary md:text-display-md">Password updated</h1>
                    <p className="text-md text-tertiary">
                        Your password has been changed successfully. Redirecting you to your dashboard&hellip;
                    </p>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-2 lg:gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-brand-secondary">
                    <Lock className="size-6 text-fg-brand-primary" />
                </div>
                <h1 className="text-display-xs font-semibold text-primary md:text-display-md">Set a new password</h1>
                <p className="text-md text-tertiary">Choose a strong password you haven&apos;t used elsewhere.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {error && (
                    <div className="rounded-lg bg-error-secondary px-4 py-3">
                        <p className="text-sm text-error-primary">{error}</p>
                    </div>
                )}

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-sm font-medium text-secondary">
                        New password
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
                            placeholder="Enter your new password"
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

                    <ul className="mt-1 flex flex-col gap-1.5">
                        {PASSWORD_REQUIREMENTS.map((req) => {
                            const met = req.test(password);
                            return (
                                <li
                                    key={req.id}
                                    className={cx(
                                        "flex items-center gap-2 text-xs transition duration-100",
                                        met ? "text-success-primary" : "text-tertiary",
                                    )}
                                >
                                    <span className={cx(
                                        "flex size-4 items-center justify-center rounded-full text-[10px] font-bold",
                                        met ? "bg-success-secondary text-fg-success-primary" : "bg-tertiary text-quaternary",
                                    )}>
                                        {met ? "✓" : ""}
                                    </span>
                                    {req.label}
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="confirm" className="text-sm font-medium text-secondary">
                        Confirm password
                    </label>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-fg-quaternary" />
                        <input
                            id="confirm"
                            type={showPassword ? "text" : "password"}
                            required
                            autoComplete="new-password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Confirm your new password"
                            className={cx(
                                "w-full rounded-lg bg-secondary py-2.5 pl-11 pr-3.5 text-md text-primary outline-none ring-1 ring-inset placeholder:text-placeholder transition duration-100 focus:ring-2 shadow-xs",
                                confirm.length > 0 && !passwordsMatch
                                    ? "ring-error focus:ring-error"
                                    : "ring-primary focus:ring-brand",
                            )}
                        />
                    </div>
                    {confirm.length > 0 && !passwordsMatch && (
                        <p className="text-xs text-error-primary">Passwords do not match</p>
                    )}
                    {passwordsMatch && (
                        <p className="text-xs text-success-primary">Passwords match</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading || !allRequirementsMet || !passwordsMatch}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-solid py-2.5 text-md font-semibold text-white shadow-xs transition duration-100 hover:bg-brand-solid_hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? <Loader2 className="size-5 animate-spin" /> : null}
                    {loading ? "Saving…" : "Update password"}
                </button>
            </form>

            <div className="flex justify-center">
                <Link href="/sign-in" className="text-sm font-semibold text-brand-secondary transition duration-100 hover:text-brand-primary">
                    Back to sign in
                </Link>
            </div>
        </>
    );
}
