// =============================================================================
// Authentication & Authorization
// Mock implementation — replace getAuthContext() with Clerk when wiring auth
// =============================================================================

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'VIEWER';

export interface AuthContext {
  userId: string;
  dbUserId: string;
  organizationId: string;
  role: UserRole;
  email: string;
  fullName: string;
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  STAFF: 2,
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

/**
 * Get the authenticated user context.
 * MOCK: Always returns a hardcoded admin user.
 * TODO: Replace with Clerk auth() + DB user lookup when auth is wired.
 */
export async function getAuthContext(): Promise<AuthContext> {
  return {
    userId: 'clerk-user-1',
    dbUserId: 'user-1',
    organizationId: 'org-1',
    role: 'ADMIN',
    email: 'jane@brightwood.co.uk',
    fullName: 'Jane Smith',
  };
}

/**
 * Require the user to have at least the specified role level.
 * Throws AuthError if the user's role is below the minimum.
 */
export function requireMinRole(auth: AuthContext, minRole: UserRole): void {
  if (ROLE_HIERARCHY[auth.role] < ROLE_HIERARCHY[minRole]) {
    throw new AuthError('FORBIDDEN', `Requires at least ${minRole} role`);
  }
}

/**
 * Require the user to have one of the specified roles.
 */
export function requireRole(auth: AuthContext, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(auth.role)) {
    throw new AuthError('FORBIDDEN', `Requires one of: ${allowedRoles.join(', ')}`);
  }
}

/**
 * Check if user has at least the given role level (non-throwing).
 */
export function hasMinRole(auth: AuthContext, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[auth.role] >= ROLE_HIERARCHY[minRole];
}
