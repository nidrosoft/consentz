"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, User } from "lucide-react";
import { OAuthStrategy } from "@clerk/types";

export default function SignUpPage() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const router = useRouter();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded || !signUp) return;

        setLoading(true);
        setError("");

        try {
            await signUp.create({
                firstName: firstName || undefined,
                lastName: lastName || undefined,
                emailAddress: email,
                password,
            });

            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
        } catch (err: unknown) {
            const clerkErr = err as { errors?: { longMessage?: string; message?: string }[] };
            setError(clerkErr.errors?.[0]?.longMessage || clerkErr.errors?.[0]?.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded || !signUp) return;

        setLoading(true);
        setError("");

        try {
            const result = await signUp.attemptEmailAddressVerification({ code: verificationCode });

            if (result.status === "complete" && result.createdSessionId) {
                await setActive({ session: result.createdSessionId });
                router.push("/welcome");
            }
        } catch (err: unknown) {
            const clerkErr = err as { errors?: { longMessage?: string; message?: string }[] };
            setError(clerkErr.errors?.[0]?.longMessage || clerkErr.errors?.[0]?.message || "Invalid verification code.");
        } finally {
            setLoading(false);
        }
    };

    const handleOAuth = async (strategy: OAuthStrategy) => {
        if (!isLoaded || !signUp) return;
        try {
            await signUp.authenticateWithRedirect({
                strategy,
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/welcome",
            });
        } catch (err: unknown) {
            const clerkErr = err as { errors?: { message?: string }[] };
            setError(clerkErr.errors?.[0]?.message || "OAuth sign-up failed.");
        }
    };

    if (pendingVerification) {
        return (
            <>
                <div className="flex flex-col gap-2 lg:gap-3">
                    <h1 className="text-display-xs font-semibold text-primary md:text-display-md">Verify your email</h1>
                    <p className="text-md text-tertiary">We sent a code to <span className="font-medium text-secondary">{email}</span></p>
                </div>

                <form onSubmit={handleVerification} className="flex flex-col gap-5">
                    {error && (
                        <div className="rounded-lg bg-error-secondary px-4 py-3">
                            <p className="text-sm text-error-primary">{error}</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="code" className="text-sm font-medium text-secondary">
                            Verification code
                        </label>
                        <input
                            id="code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            required
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder="Enter 6-digit code"
                            className="w-full rounded-lg bg-secondary py-2.5 px-3.5 text-center text-lg font-semibold tracking-[0.3em] text-primary outline-none ring-1 ring-primary ring-inset placeholder:text-placeholder placeholder:tracking-normal placeholder:font-normal placeholder:text-md transition duration-100 focus:ring-2 focus:ring-brand shadow-xs"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !isLoaded}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-solid py-2.5 text-md font-semibold text-white shadow-xs transition duration-100 hover:bg-brand-solid_hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="size-5 animate-spin" /> : null}
                        {loading ? "Verifying…" : "Verify email"}
                    </button>
                </form>
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
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a password"
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
                </div>

                <button
                    type="submit"
                    disabled={loading || !isLoaded}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-solid py-2.5 text-md font-semibold text-white shadow-xs transition duration-100 hover:bg-brand-solid_hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? <Loader2 className="size-5 animate-spin" /> : null}
                    {loading ? "Creating account…" : "Continue"}
                    {!loading && <ArrowRight className="size-4" />}
                </button>

                <div className="relative flex items-center">
                    <div className="flex-1 border-t border-secondary" />
                    <span className="px-3 text-xs uppercase tracking-widest text-tertiary">or</span>
                    <div className="flex-1 border-t border-secondary" />
                </div>

                <button
                    type="button"
                    onClick={() => handleOAuth("oauth_google")}
                    className="flex w-full items-center justify-center gap-3 rounded-lg bg-primary py-2.5 text-sm font-semibold text-secondary shadow-xs ring-1 ring-primary ring-inset transition duration-100 hover:bg-primary_hover"
                >
                    <svg className="size-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
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
