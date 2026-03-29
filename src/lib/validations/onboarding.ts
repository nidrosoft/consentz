import { z } from "zod";

import { shortString } from "@/lib/validations/shared";

export const onboardingServiceTypeSchema = z.object({
    serviceType: z.enum(["AESTHETIC_CLINIC", "CARE_HOME"]),
});

export const onboardingOrganizationSchema = z.object({
    name: shortString(255),
    postcode: z.string().min(2).max(20),
    bedCount: z.number().int().positive().max(1000),
    cqcProviderId: z.string().max(50).optional().nullable(),
    cqcLocationId: z.string().max(50).optional().nullable(),
    registeredManager: z.string().max(255).optional().nullable(),
    cqcCurrentRatingLabel: z
        .enum(["Not yet rated", "Outstanding", "Good", "Requires Improvement", "Inadequate"])
        .optional()
        .nullable(),
    cqcLastInspection: z.string().optional().nullable(),
});

export const onboardingAssessmentSchema = z.object({
    answers: z.record(z.string(), z.string()).refine((o) => Object.keys(o).length > 0, {
        message: "answers required",
    }),
});
