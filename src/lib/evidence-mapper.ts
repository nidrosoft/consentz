import type { Evidence, EvidenceType, EvidenceStatus, DomainSlug } from '@/types';

/** Normalize API/Prisma response to Evidence shape (handles both title/name, category/type, etc.) */
export function toEvidence(item: Record<string, unknown>): Evidence {
  const linkedKloes = Array.isArray(item.linkedKloes)
    ? (item.linkedKloes as string[])
    : item.kloeCode
      ? String(item.kloeCode)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  const linkedDomains = (Array.isArray(item.linkedDomains) ? item.linkedDomains : item.domains ?? []) as DomainSlug[];
  const uploadedAt = item.uploadedAt
    ? String(item.uploadedAt)
    : item.createdAt
      ? new Date(item.createdAt as string).toISOString().split('T')[0]
      : '';
  const expiresAt = item.expiresAt
    ? String(item.expiresAt)
    : item.expiryDate
      ? new Date(item.expiryDate as string).toISOString().split('T')[0]
      : null;
  return {
    id: String(item.id),
    name: String(item.name ?? item.title ?? ''),
    type: (item.type ?? item.category ?? 'OTHER') as EvidenceType,
    fileName: String(item.fileName ?? ''),
    fileSize: String(item.fileSize ?? ''),
    uploadedBy: String(item.uploadedBy ?? ''),
    uploadedAt,
    expiresAt,
    linkedDomains,
    linkedKloes,
    status: (item.status ?? 'VALID') as EvidenceStatus,
  };
}
