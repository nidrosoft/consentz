import { auth } from '@clerk/nextjs/server';
import { db as prisma } from '@/lib/db';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'COMPLIANCE_MANAGER'
  | 'DEPARTMENT_LEAD'
  | 'STAFF_MEMBER'
  | 'AUDITOR'
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'STAFF'
  | 'VIEWER';

export interface AuthContext {
  userId: string;
  dbUserId: string;
  organizationId: string;
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
  code: 'UNAUTHORIZED' | 'FORBIDDEN';
  statusCode: number;

  constructor(code: 'UNAUTHORIZED' | 'FORBIDDEN', message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = code === 'FORBIDDEN' ? 403 : 401;
  }
}

const DEV_FALLBACK: AuthContext = {
  userId: 'demo_clerk_user',
  dbUserId: '28cdb01f-107f-42e1-9d30-1cd01ff92b49',
  organizationId: 'c9a2e3fc-23d7-4443-9c09-b1b6a67a32e6',
  role: 'COMPLIANCE_MANAGER',
  email: 'admin@consentz.com',
  fullName: 'Dr. Sarah Johnson',
};

/**
 * Get the authenticated user context from Clerk + DB lookup.
 * Falls back to a demo user when Clerk keys are not configured.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!clerkPublishableKey) {
    return DEV_FALLBACK;
  }

  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new AuthError('UNAUTHORIZED', 'Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    include: { organization: true },
  });

  if (!user) {
    const member = await prisma.organizationMember.findFirst({
      where: { clerkUserId },
      include: { organization: true },
    });

    if (member) {
      return {
        userId: clerkUserId,
        dbUserId: member.id,
        organizationId: member.organizationId,
        role: member.role as UserRole,
        email: member.email,
        fullName: member.fullName,
      };
    }

    throw new AuthError('UNAUTHORIZED', 'User not found in database. Complete onboarding first.');
  }

  return {
    userId: clerkUserId,
    dbUserId: user.id,
    organizationId: user.organizationId ?? '',
    role: user.role as UserRole,
    email: user.email,
    fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
  };
}

export function requireMinRole(auth: AuthContext, minRole: UserRole): void {
  if (ROLE_HIERARCHY[auth.role] < ROLE_HIERARCHY[minRole]) {
    throw new AuthError('FORBIDDEN', `Requires at least ${minRole} role`);
  }
}

export function requireRole(auth: AuthContext, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(auth.role)) {
    throw new AuthError('FORBIDDEN', `Requires one of: ${allowedRoles.join(', ')}`);
  }
}

export function hasMinRole(auth: AuthContext, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[auth.role] >= ROLE_HIERARCHY[minRole];
}
