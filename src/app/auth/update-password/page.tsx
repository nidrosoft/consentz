"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Loader2 } from "lucide-react";

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

            router.refresh();
            router.push("/");
        } catch {
            setError("Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex flex-col gap-2 lg:gap-3">
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
                            className="w-full rounded-lg bg-secondary py-2.5 pl-11 pr-11 text-md text-primary outline-none ring-1 ring-primary ring-inset transition duration-100 focus:ring-2 focus:ring-brand shadow-xs"
                        />
                        <button
                            type="button"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-quaternary hover:text-fg-secondary"
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
                            className="w-full rounded-lg bg-secondary py-2.5 pl-11 pr-3.5 text-md text-primary outline-none ring-1 ring-primary ring-inset transition duration-100 focus:ring-2 focus:ring-brand shadow-xs"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-solid py-2.5 text-md font-semibold text-white shadow-xs transition duration-100 hover:bg-brand-solid_hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? <Loader2 className="size-5 animate-spin" /> : null}
                    {loading ? "Saving…" : "Update password"}
                </button>
            </form>
        </>
    );
}
