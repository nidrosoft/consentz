import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { getDb } from '@/lib/db';

export const GET = withAuth(async (req, { params, auth }) => {
  const client = await getDb();
  const url = new URL(req.url);
  const serviceType = url.searchParams.get('serviceType') ?? 'AESTHETIC_CLINIC';

  const { data: questions } = await client.from('assessment_questions')
    .select('*, kloe:kloes(*)')
    .eq('service_type', serviceType)
    .order('sort_order', { ascending: true });

  const items = questions ?? [];

  const grouped = new Map<string, {
    domain: string;
    domainName: string;
    kloeCode: string;
    kloeTitle: string;
    questions: typeof items;
  }>();

  for (const q of items) {
    const code = (q.kloe as any)?.code ?? 'S1';
    const domainCode = code[0] ?? 'S';
    const domainMap: Record<string, string> = {
      S: 'safe', E: 'effective', C: 'caring', R: 'responsive', W: 'well-led',
    };
    const domainNameMap: Record<string, string> = {
      S: 'Safe', E: 'Effective', C: 'Caring', R: 'Responsive', W: 'Well-Led',
    };
    const domain = domainMap[domainCode] ?? 'safe';

    if (!grouped.has(code)) {
      grouped.set(code, {
        domain,
        domainName: domainNameMap[domainCode] ?? 'Safe',
        kloeCode: code,
        kloeTitle: (q.kloe as any)?.question ?? code,
        questions: [],
      });
    }
    grouped.get(code)!.questions.push(q);
  }

  return apiSuccess({
    total: items.length,
    serviceType,
    sections: Array.from(grouped.values()),
  });
});
