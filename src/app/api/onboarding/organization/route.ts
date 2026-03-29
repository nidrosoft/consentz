import { withAuth } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { OnboardingService } from "@/lib/services/onboarding-service";
import { onboardingOrganizationSchema } from "@/lib/validations/onboarding";

export const PATCH = withAuth(async (req, { auth }) => {
    const body = await req.json();
    const data = onboardingOrganizationSchema.parse(body);

    await OnboardingService.updateOrganizationDetails({
        organizationId: auth.organizationId,
        dbUserId: auth.dbUserId,
        data: {
            name: data.name,
            postcode: data.postcode,
            bedCount: data.bedCount,
            cqcProviderId: data.cqcProviderId,
            cqcLocationId: data.cqcLocationId,
            registeredManager: data.registeredManager,
            cqcCurrentRatingLabel: data.cqcCurrentRatingLabel,
            cqcLastInspection: data.cqcLastInspection ?? undefined,
        },
    });

    return apiSuccess({ ok: true });
});
