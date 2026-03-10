import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { db } from '@/lib/db';
import type { ServiceType } from '@prisma/client';

export const GET = withAuth(async (req, { params, auth }) => {
  const url = new URL(req.url);
  const serviceType = (url.searchParams.get('serviceType') ?? 'AESTHETIC_CLINIC') as ServiceType;

  const questions = await db.assessmentQuestion.findMany({
    where: { serviceType },
    include: { kloe: true },
    orderBy: { sortOrder: 'asc' },
  });

  const grouped = new Map<string, {
    domain: string;
    domainName: string;
    kloeCode: string;
    kloeTitle: string;
    questions: typeof questions;
  }>();

  for (const q of questions) {
    const code = q.kloe?.code ?? 'S1';
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
        kloeTitle: q.kloe?.question ?? code,
        questions: [],
      });
    }
    grouped.get(code)!.questions.push(q);
  }

  return apiSuccess({
    total: questions.length,
    serviceType,
    sections: Array.from(grouped.values()),
  });
});
