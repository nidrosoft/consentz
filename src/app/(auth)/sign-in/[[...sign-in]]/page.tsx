"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail01, Lock01, Eye, EyeOff } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { SocialButton } from "@/components/base/buttons/social-button";
import { Input } from "@/components/base/input/input";

export default function SignInPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            router.push("/");
        }, 1500);
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-display-xs font-semibold text-primary">Welcome back</h1>
                <p className="text-md text-tertiary">Sign in to your account</p>
            </div>

            {error && (
                <div className="rounded-lg bg-error-secondary px-4 py-3 text-sm text-error-primary">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <Input
                    label="Email"
                    placeholder="you@clinic.co.uk"
                    icon={Mail01}
                    type="email"
                    value={email}
                    onChange={(v) => setEmail(v as string)}
                    isRequired
                />
                <div className="flex flex-col gap-1.5">
                    <Input
                        label="Password"
                        placeholder="Enter your password"
                        icon={Lock01}
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(v) => setPassword(v as string)}
                        isRequired
                    />
                    <div className="flex justify-end">
                        <Button
                            color="link-color"
                            size="sm"
                            onClick={() => {}}
                        >
                            Forgot password?
                        </Button>
                    </div>
                </div>

                <Button
                    type="submit"
                    color="primary"
                    size="lg"
                    isLoading={isLoading}
                    showTextWhileLoading
                    className="w-full"
                >
                    {isLoading ? "Signing in..." : "Sign in"}
                </Button>
            </form>

            <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border-secondary" />
                <span className="text-sm text-tertiary">or continue with</span>
                <div className="h-px flex-1 bg-border-secondary" />
            </div>

            <div className="flex gap-3">
                <SocialButton social="google" size="md" className="flex-1">
                    Google
                </SocialButton>
                <SocialButton social="apple" size="md" className="flex-1">
                    Microsoft
                </SocialButton>
            </div>

            <p className="text-center text-sm text-tertiary">
                Don&apos;t have an account?{" "}
                <Button color="link-color" size="sm" href="/sign-up">
                    Sign up
                </Button>
            </p>

            {/* Demo quick links */}
            <div className="rounded-xl border border-dashed border-brand-300 bg-brand-secondary p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-brand-primary">Demo Quick Links</p>
                <div className="flex flex-wrap gap-2">
                    <Button color="secondary" size="sm" onClick={() => router.push("/")}>Dashboard</Button>
                    <Button color="secondary" size="sm" onClick={() => router.push("/welcome")}>Onboarding</Button>
                    <Button color="secondary" size="sm" onClick={() => router.push("/domains")}>Domains</Button>
                    <Button color="secondary" size="sm" onClick={() => router.push("/evidence")}>Evidence</Button>
                    <Button color="secondary" size="sm" onClick={() => router.push("/policies")}>Policies</Button>
                    <Button color="secondary" size="sm" onClick={() => router.push("/staff")}>Staff</Button>
                    <Button color="secondary" size="sm" onClick={() => router.push("/incidents")}>Incidents</Button>
                    <Button color="secondary" size="sm" onClick={() => router.push("/tasks")}>Tasks</Button>
                    <Button color="secondary" size="sm" onClick={() => router.push("/reports")}>Reports</Button>
                    <Button color="secondary" size="sm" onClick={() => router.push("/settings")}>Settings</Button>
                </div>
            </div>
        </div>
    );
}
