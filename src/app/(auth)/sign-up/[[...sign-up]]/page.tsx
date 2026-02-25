"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail01, Lock01, User01, Check } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { SocialButton } from "@/components/base/buttons/social-button";
import { Input } from "@/components/base/input/input";
import { Checkbox } from "@/components/base/checkbox/checkbox";

const PASSWORD_RULES = [
    { label: "8+ characters", test: (p: string) => p.length >= 8 },
    { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "Number", test: (p: string) => /\d/.test(p) },
    { label: "Special character", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function SignUpPage() {
    const router = useRouter();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName || !email || !password || !agreed) return;
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            router.push("/welcome");
        }, 1500);
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-display-xs font-semibold text-primary">Create your account</h1>
                <p className="text-md text-tertiary">Start your compliance journey</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex gap-4">
                    <Input
                        label="First name"
                        placeholder="Jane"
                        icon={User01}
                        value={firstName}
                        onChange={(v) => setFirstName(v as string)}
                        isRequired
                    />
                    <Input
                        label="Last name"
                        placeholder="Smith"
                        value={lastName}
                        onChange={(v) => setLastName(v as string)}
                    />
                </div>

                <Input
                    label="Email"
                    placeholder="you@clinic.co.uk"
                    icon={Mail01}
                    type="email"
                    value={email}
                    onChange={(v) => setEmail(v as string)}
                    isRequired
                />

                <div className="flex flex-col gap-2">
                    <Input
                        label="Password"
                        placeholder="Create a password"
                        icon={Lock01}
                        type="password"
                        value={password}
                        onChange={(v) => setPassword(v as string)}
                        isRequired
                    />
                    {password && (
                        <div className="flex flex-col gap-1 pt-1">
                            {PASSWORD_RULES.map((rule) => {
                                const passed = rule.test(password);
                                return (
                                    <div key={rule.label} className="flex items-center gap-2">
                                        <div className={`flex size-4 items-center justify-center rounded-full ${passed ? "bg-success-solid" : "bg-quaternary"}`}>
                                            <Check className={`size-3 ${passed ? "text-white" : "text-quaternary"}`} />
                                        </div>
                                        <span className={`text-xs ${passed ? "text-success-primary" : "text-quaternary"}`}>
                                            {rule.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <Checkbox
                    isSelected={agreed}
                    onChange={setAgreed}
                    label="I agree to the Terms of Service and Privacy Policy"
                />

                <Button
                    type="submit"
                    color="primary"
                    size="lg"
                    isLoading={isLoading}
                    showTextWhileLoading
                    isDisabled={!agreed || !firstName || !email || !password}
                    className="w-full"
                >
                    {isLoading ? "Creating account..." : "Create account"}
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
                Already have an account?{" "}
                <Button color="link-color" size="sm" href="/sign-in">
                    Sign in
                </Button>
            </p>
        </div>
    );
}
