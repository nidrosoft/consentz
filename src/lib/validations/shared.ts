import { z } from 'zod';

// =============================================================================
// Shared Validation Primitives
// =============================================================================

export const uuidSchema = z.string().uuid();

export const cqcDomainTypeSchema = z.enum(['SAFE', 'EFFECTIVE', 'CARING', 'RESPONSIVE', 'WELL_LED']);

export const domainSlugSchema = z.enum(['safe', 'effective', 'caring', 'responsive', 'well-led']);

export const cqcRatingSchema = z.enum(['OUTSTANDING', 'GOOD', 'REQUIRES_IMPROVEMENT', 'INADEQUATE']);

export const serviceTypeSchema = z.enum(['AESTHETIC_CLINIC', 'CARE_HOME']);

export const gapSeveritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

export const gapStatusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ACCEPTED_RISK']);

export const kloeCodeSchema = z.string().regex(/^[SECRW]\d{1,2}$/, 'KLOE code must be like S1, E3, C2, R1, W6');

export const regulationCodeSchema = z.string().regex(/^REG\d{1,2}A?$/, 'Regulation code must be like REG9, REG12, REG20A');

export const dateStringSchema = z.string().datetime({ offset: true }).or(z.string().date());

export const shortString = (max = 255) => z.string().min(1).max(max).trim();

export const longString = (max = 5000) => z.string().min(1).max(max).trim();

export const kloeCodesSchema = z.array(kloeCodeSchema).max(25);

export const regulationCodesSchema = z.array(regulationCodeSchema).max(14);
