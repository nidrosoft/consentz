import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UserRole =
    | "SUPER_ADMIN"
    | "COMPLIANCE_MANAGER"
    | "DEPARTMENT_LEAD"
    | "STAFF_MEMBER"
    | "AUDITOR"
    | "OWNER"
    | "ADMIN"
    | "MANAGER"
    | "STAFF"
    | "VIEWER";

export interface AuthContext {
    userId: string;
    dbUserId: string;
    organizationId: string;
    role: UserRole;
    email: string;
    fullName: string;
}

/** Session without requiring a linked organisation (onboarding step 1). */
export interface SessionAuth {
    userId: string;
    dbUserId: string;
    organizationId: string | null;
    role: UserRole;
    email: string;
    fullName: string;
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
    SUPER_ADMIN: 5,
    OWNER: 5,
    COMPLIANCE_MANAGER: 4,
    ADMIN: 4,
    DEPARTMENT_LEAD: 3,
    MANAGER: 3,
    STAFF_MEMBER: 2,
    STAFF: 2,
    AUDITOR: 1,
    VIEWER: 1,
};

export class AuthError extends Error {
    code: "UNAUTHORIZED" | "FORBIDDEN";
    statusCode: number;

    constructor(code: "UNAUTHORIZED" | "FORBIDDEN", message: string) {
        super(message);
        this.name = "AuthError";
        this.code = code;
        this.statusCode = code === "FORBIDDEN" ? 403 : 401;
    }
}

const DEV_FALLBACK: AuthContext = {
    userId: "a0000000-0000-4000-8000-000000000001",
    dbUserId: "28cdb01f-107f-42e1-9d30-1cd01ff92b49",
    organizationId: "c9a2e3fc-23d7-4443-9c09-b1b6a67a32e6",
    role: "COMPLIANCE_MANAGER",
    email: "admin@consentz.com",
    fullName: "Dr. Sarah Johnson",
};

/**
 * Supabase session + DB user (or org member). Organisation may be null during onboarding.
 * Set AUTH_DEV_BYPASS=true only for local tooling without Supabase cookies.
 */
export async function resolveSessionAuth(): Promise<SessionAuth> {
    if (process.env.AUTH_DEV_BYPASS === "true" && process.env.NODE_ENV !== "production") {
        return {
            userId: DEV_FALLBACK.userId,
            dbUserId: DEV_FALLBACK.dbUserId,
            organizationId: DEV_FALLBACK.organizationId,
            role: DEV_FALLBACK.role,
            email: DEV_FALLBACK.email,
            fullName: DEV_FALLBACK.fullName,
        };
    }

    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new AuthError("UNAUTHORIZED", "Not authenticated");
    }

    const { data: dbUser } = await supabase
        .from("users")
        .select("*, organizations(*)")
        .eq("supabase_user_id", user.id)
        .maybeSingle();

    if (!dbUser) {
        const { data: member } = await supabase
            .from("organization_members")
            .select("*, organizations(*)")
            .eq("auth_user_id", user.id)
            .limit(1)
            .maybeSingle();

        if (member) {
            return {
                userId: user.id,
                dbUserId: member.id,
                organizationId: member.organization_id,
                role: member.role as UserRole,
                email: member.email,
                fullName: member.full_name,
            };
        }

        throw new AuthError("UNAUTHORIZED", "User not found in database. Complete sign up first.");
    }

    return {
        userId: user.id,
        dbUserId: dbUser.id,
        organizationId: dbUser.organization_id,
        role: dbUser.role as UserRole,
        email: dbUser.email,
        fullName: [dbUser.first_name, dbUser.last_name].filter(Boolean).join(" ") || dbUser.email,
    };
}

/**
 * Requires a linked organisation. Use for dashboard and org-scoped APIs.
 */
export async function getAuthContext(): Promise<AuthContext> {
    const session = await resolveSessionAuth();
    if (!session.organizationId) {
        throw new AuthError(
            "FORBIDDEN",
            "Complete organisation onboarding before accessing this resource.",
        );
    }
    return {
        userId: session.userId,
        dbUserId: session.dbUserId,
        organizationId: session.organizationId,
        role: session.role,
        email: session.email,
        fullName: session.fullName,
    };
}

export function requireMinRole(auth: AuthContext, minRole: UserRole): void {
    if (ROLE_HIERARCHY[auth.role] < ROLE_HIERARCHY[minRole]) {
        throw new AuthError("FORBIDDEN", `Requires at least ${minRole} role`);
    }
}

export function requireRole(auth: AuthContext, allowedRoles: UserRole[]): void {
    if (!allowedRoles.includes(auth.role)) {
        throw new AuthError("FORBIDDEN", `Requires one of: ${allowedRoles.join(", ")}`);
    }
}

export function hasMinRole(auth: AuthContext, minRole: UserRole): boolean {
    return ROLE_HIERARCHY[auth.role] >= ROLE_HIERARCHY[minRole];
}
