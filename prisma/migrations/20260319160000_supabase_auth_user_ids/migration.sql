-- Link Prisma `users` and `organization_members` to Supabase Auth user IDs (replaces Clerk columns).

ALTER TABLE "users" RENAME COLUMN "clerk_id" TO "supabase_user_id";

ALTER TABLE "organization_members" RENAME COLUMN "clerk_user_id" TO "auth_user_id";

-- Unique index name may still be users_clerk_id_key until recreated; column rename is sufficient.

DROP INDEX IF EXISTS "idx_users_clerk";
CREATE INDEX "idx_users_supabase" ON "users"("supabase_user_id");

DROP INDEX IF EXISTS "idx_org_members_clerk";
CREATE INDEX "idx_org_members_auth" ON "organization_members"("auth_user_id");
