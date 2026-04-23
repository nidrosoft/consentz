// =============================================================================
// GET /api/policy-templates
//   ?evidenceItemId=S1_EV01        — templates satisfying one evidence item
//   ?kloeCode=S1                   — all templates linked to a KLOE (deduped)
//   ?kloeCode=S1&groupBy=evidenceItem — map keyed by evidence item id
//   (no params)                    — full Cura template catalogue
//
// Returns the ingested Cura policy templates with their coverage status.
// =============================================================================

import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import {
  getAllTemplates,
  getTemplatesForEvidenceItem,
  getTemplatesForKloe,
  getTemplateMapForKloe,
} from '@/lib/services/policy-template-service';

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const evidenceItemId = url.searchParams.get('evidenceItemId');
  const kloeCode = url.searchParams.get('kloeCode');
  const groupBy = url.searchParams.get('groupBy'); // 'evidenceItem' | null

  if (evidenceItemId) {
    const templates = await getTemplatesForEvidenceItem(evidenceItemId);
    return apiSuccess(templates);
  }
  if (kloeCode) {
    if (groupBy === 'evidenceItem') {
      const map = await getTemplateMapForKloe(kloeCode);
      return apiSuccess(map);
    }
    const templates = await getTemplatesForKloe(kloeCode);
    return apiSuccess(templates);
  }
  const all = await getAllTemplates();
  return apiSuccess(all);
});
