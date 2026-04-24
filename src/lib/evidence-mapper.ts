import type { Evidence, EvidenceType, EvidenceStatus, DomainSlug } from '@/types';

/** Normalize API response to Evidence shape (handles both title/name, category/type, etc.) */
export function toEvidence(item: Record<string, unknown>): Evidence {
  // Accept camelCase (new) and snake_case (DB payload). Coerce either shape so
  // the evidence screen renders KLOE + domain badges regardless of source.
  const rawKloe = item.linkedKloes ?? item.kloeCode ?? item.kloe_code;
  const linkedKloes = Array.isArray(rawKloe)
    ? (rawKloe as string[])
    : rawKloe
      ? String(rawKloe)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  const linkedDomains = (Array.isArray(item.linkedDomains)
    ? item.linkedDomains
    : Array.isArray(item.domains)
      ? item.domains
      : []) as DomainSlug[];
  const uploadedAt = item.uploadedAt
    ? String(item.uploadedAt)
    : item.createdAt ?? item.created_at
      ? new Date((item.createdAt ?? item.created_at) as string).toISOString().split('T')[0]
      : '';
  const expiresAt = item.expiresAt
    ? String(item.expiresAt)
    : item.expiryDate ?? item.expiry_date
      ? new Date((item.expiryDate ?? item.expiry_date) as string).toISOString().split('T')[0]
      : null;
  return {
    id: String(item.id),
    name: String(item.name ?? item.title ?? ''),
    type: (item.type ?? item.category ?? 'OTHER') as EvidenceType,
    fileName: String(item.fileName ?? item.file_name ?? ''),
    fileSize: String(item.fileSize ?? item.file_size ?? ''),
    uploadedBy: String(item.uploadedBy ?? item.uploaded_by ?? ''),
    uploadedAt,
    expiresAt,
    linkedDomains,
    linkedKloes,
    status: (item.status ?? 'VALID') as EvidenceStatus,
  };
}
