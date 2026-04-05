import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { parsePagination } from '@/lib/pagination';
import { EvidenceService } from '@/lib/services/evidence-service';
import { AuditService } from '@/lib/services/audit-service';
import { createEvidenceSchema, evidenceFilterSchema } from '@/lib/validations/evidence';
import type { DomainSlug, EvidenceStatus, EvidenceType } from '@/types';

export const GET = withAuth(async (req, { params, auth }) => {
  const { searchParams } = new URL(req.url);
  const pagination = parsePagination(searchParams);

  const rawFilters = evidenceFilterSchema.parse({
    category: searchParams.get('category') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    domain: searchParams.get('domain') ?? undefined,
    kloeCode: searchParams.get('kloeCode') ?? undefined,
    expiringSoon: searchParams.get('expiringSoon') ?? undefined,
  });

  const filters: {
    category?: EvidenceType;
    status?: EvidenceStatus;
    domain?: DomainSlug;
    kloeCode?: string;
  } = {};

  if (rawFilters.category) filters.category = rawFilters.category as EvidenceType;
  if (rawFilters.status) filters.status = rawFilters.status as EvidenceStatus;
  if (rawFilters.domain) filters.domain = rawFilters.domain as DomainSlug;
  if (rawFilters.kloeCode) filters.kloeCode = rawFilters.kloeCode as string;

  const result = await EvidenceService.list({
    organizationId: auth.organizationId,
    pagination,
    filters,
  });

  return apiSuccess(result.data, result.meta);
});

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'STAFF');

  const body = await req.json();
  const validated = createEvidenceSchema.parse(body);

  const evidence = await EvidenceService.create({
    organizationId: auth.organizationId,
    name: validated.name,
    category: validated.category as EvidenceType,
    fileName: validated.fileName,
    fileUrl: validated.fileUrl,
    fileType: validated.fileType,
    uploadedBy: auth.fullName,
    expiresAt: validated.validUntil ?? null,
    linkedDomains: validated.linkedDomains ?? [],
    linkedKloes: validated.linkedKloes ?? [],
  });

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'EVIDENCE_UPLOADED',
    entityType: 'EVIDENCE',
    entityId: evidence.id,
    description: `Uploaded evidence: ${validated.name}`,
  });

  return apiSuccess(evidence, undefined, 201);
});
