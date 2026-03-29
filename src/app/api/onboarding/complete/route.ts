import { withAuth } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { OnboardingService } from "@/lib/services/onboarding-service";

export const POST = withAuth(async (_req, { auth }) => {
    await OnboardingService.markOnboardingFinished({
        organizationId: auth.organizationId,
        dbUserId: auth.dbUserId,
    });
    return apiSuccess({ ok: true });
});
