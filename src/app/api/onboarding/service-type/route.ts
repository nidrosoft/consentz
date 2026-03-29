import { withSession } from "@/lib/api-handler";
import { apiSuccess, ApiErrors } from "@/lib/api-response";
import { OnboardingService } from "@/lib/services/onboarding-service";
import { onboardingServiceTypeSchema } from "@/lib/validations/onboarding";

export const POST = withSession(async (req, { auth }) => {
    const body = await req.json();
    const { serviceType } = onboardingServiceTypeSchema.parse(body);

    try {
        const result = await OnboardingService.setServiceType({
            dbUserId: auth.dbUserId,
            serviceType,
        });
        return apiSuccess(result);
    } catch (e) {
        if (e instanceof Error && e.message === "USER_NOT_FOUND") {
            return ApiErrors.unauthorized("User record not found.");
        }
        throw e;
    }
});
