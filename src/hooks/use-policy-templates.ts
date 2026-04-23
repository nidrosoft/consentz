'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet, buildQueryString } from '@/lib/api-client';

export type PolicyTemplateCoverage = 'covered' | 'partial' | 'via_consentz';

export interface PolicyTemplateDTO {
  id: string;
  code: string;                     // 'CPS-14'
  filename: string;                 // 'CPS-14_safeguarding_adults.docx'
  title: string;                    // 'Safeguarding Adults & Vulnerable Adults Policy'
  category: string;                 // 'CPS'
  categoryLabel: string;            // 'Clinical & Patient Safety'
  policyNumber: number | null;
  section: string | null;
  storagePath: string;
  appliesToServiceTypes: string[];
  isSupplementary: boolean;
  charCount: number;
  coverageStatus: PolicyTemplateCoverage;
  coverageNotes: string | null;
}

/**
 * Fetch Cura policy templates that satisfy a given evidence item.
 * Returns [] when no templates are mapped (i.e. the PDF listed the item
 * as a gap — the clinic must upload their own document).
 */
export function usePolicyTemplatesForEvidence(evidenceItemId: string | null) {
  const qs = evidenceItemId ? buildQueryString({ evidenceItemId }) : '';
  return useQuery({
    queryKey: ['policy-templates', 'evidence', evidenceItemId],
    queryFn: () =>
      apiGet<PolicyTemplateDTO[]>(`/api/policy-templates${qs}`).then((r) => r.data),
    enabled: !!evidenceItemId,
    staleTime: 5 * 60 * 1000, // templates are reference data
  });
}

/** Fetch all Cura policy templates linked to a KLOE (deduped list). */
export function usePolicyTemplatesForKloe(kloeCode: string | null) {
  const qs = kloeCode ? buildQueryString({ kloeCode }) : '';
  return useQuery({
    queryKey: ['policy-templates', 'kloe', kloeCode],
    queryFn: () =>
      apiGet<PolicyTemplateDTO[]>(`/api/policy-templates${qs}`).then((r) => r.data),
    enabled: !!kloeCode,
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch the Cura policy templates for a KLOE, grouped by evidence item id. */
export function usePolicyTemplateMapForKloe(kloeCode: string | null) {
  const qs = kloeCode ? buildQueryString({ kloeCode, groupBy: 'evidenceItem' }) : '';
  return useQuery({
    queryKey: ['policy-templates', 'kloe-map', kloeCode],
    queryFn: () =>
      apiGet<Record<string, PolicyTemplateDTO[]>>(`/api/policy-templates${qs}`).then((r) => r.data),
    enabled: !!kloeCode,
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch the full Cura policy template catalogue (92 templates). */
export function useAllPolicyTemplates() {
  return useQuery({
    queryKey: ['policy-templates', 'all'],
    queryFn: () =>
      apiGet<PolicyTemplateDTO[]>('/api/policy-templates').then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });
}

/** Build the personalised-DOCX download URL for a template code. */
export function getPolicyTemplateDownloadUrl(code: string): string {
  return `/api/policy-templates/${encodeURIComponent(code)}/download`;
}
