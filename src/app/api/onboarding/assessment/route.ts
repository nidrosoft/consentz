import { withAuth } from "@/lib/api-handler";
import { apiSuccess, ApiErrors } from "@/lib/api-response";
import { getDb } from "@/lib/db";
import { OnboardingService } from "@/lib/services/onboarding-service";
import { onboardingAssessmentSchema } from "@/lib/validations/onboarding";

export const POST = withAuth(async (req, { auth }) => {
    const body = await req.json();
    const { answers } = onboardingAssessmentSchema.parse(body);

    const client = await getDb();
    const { data: org } = await client.from('organizations')
        .select('service_type')
        .eq('id', auth.organizationId)
        .single();

    if (!org) {
        return ApiErrors.notFound("Organization");
    }

    try {
        const summary = await OnboardingService.submitInitialAssessment({
            organizationId: auth.organizationId,
            dbUserId: auth.dbUserId,
            serviceType: org.service_type,
            answers,
        });
        return apiSuccess(summary);
    } catch (e) {
        if (e instanceof Error && e.message === "INCOMPLETE_ASSESSMENT") {
            return ApiErrors.badRequest("Please answer every domain question.");
        }
        throw e;
    }
});
