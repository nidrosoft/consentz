import { z } from "zod";

/** Strong password: length, mixed case, digit, symbol (aligned with common enterprise policy). */
export const strongPasswordSchema = z
    .string()
    .min(12, "Use at least 12 characters")
    .regex(/[a-z]/, "Include a lowercase letter")
    .regex(/[A-Z]/, "Include an uppercase letter")
    .regex(/[0-9]/, "Include a number")
    .regex(/[^A-Za-z0-9]/, "Include a special character");

export type PasswordRequirement = { id: string; label: string; test: (p: string) => boolean };

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
    { id: "len", label: "At least 12 characters", test: (p) => p.length >= 12 },
    { id: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
    { id: "upper", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { id: "num", label: "One number", test: (p) => /[0-9]/.test(p) },
    { id: "sym", label: "One special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function validateStrongPassword(password: string): { ok: true } | { ok: false; message: string } {
    const r = strongPasswordSchema.safeParse(password);
    if (r.success) return { ok: true };
    const first = r.error.issues[0];
    return { ok: false, message: first?.message ?? "Invalid password" };
}
