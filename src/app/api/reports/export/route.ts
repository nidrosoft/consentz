import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/api-handler';
import { ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limiter';
import { exportSchema } from '@/lib/validations/report';

const DOMAIN_LABELS: Record<string, string> = {
  safe: 'Safe',
  effective: 'Effective',
  caring: 'Caring',
  responsive: 'Responsive',
  well_led: 'Well-Led',
};

function formatRatingLabel(value: string): string {
  return value.replace(/_/g, ' ');
}

export const POST = withAuth(async (req, { auth }) => {
  const client = await getDb();
  requireMinRole(auth, 'MANAGER');

  const rateCheck = checkRateLimit(auth.userId, 'export');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

  const body = await req.json();
  const validated = exportSchema.parse(body);

  const [{ data: organization }, { data: complianceScore }] = await Promise.all([
    client.from('organizations')
      .select('name')
      .eq('id', auth.organizationId)
      .single(),
    client.from('compliance_scores')
      .select('*, domain_scores(*)')
      .eq('organization_id', auth.organizationId)
      .maybeSingle(),
  ]);

  const orgName = organization?.name ?? 'Organization';
  const reportDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const overallScore = complianceScore?.score ?? null;
  const predictedRating = complianceScore?.predicted_rating ?? null;

  const domainRows =
    (complianceScore?.domain_scores as any[])
      ?.sort((a, b) => (a.domain > b.domain ? 1 : -1))
      .map((d) => [
        DOMAIN_LABELS[d.domain] ?? d.domain,
        d.score != null ? String(Math.round(d.score * 10) / 10) : '—',
        formatRatingLabel(d.status),
        String(d.total_gaps ?? 0),
      ]) ?? [];

  if (validated.format === 'pdf') {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('CQC Compliance Report', 14, 20);
    doc.setFontSize(11);
    doc.text(`Organization: ${orgName}`, 14, 30);
    doc.text(`Date: ${reportDate}`, 14, 37);
    doc.text(
      `Overall score: ${overallScore != null ? String(Math.round(overallScore * 10) / 10) : '—'}`,
      14,
      47,
    );
    doc.text(
      `Predicted rating: ${predictedRating ? formatRatingLabel(predictedRating) : '—'}`,
      14,
      54,
    );

    autoTable(doc, {
      startY: 62,
      head: [['Domain', 'Score', 'Rating', 'Gaps']],
      body: domainRows.length > 0 ? domainRows : [['—', '—', '—', '—']],
      theme: 'striped',
      headStyles: { fillColor: [66, 56, 158] },
    });

    const buffer = Buffer.from(doc.output('arraybuffer'));
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="compliance-report.pdf"',
      },
    });
  }

  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [
    'CQC Compliance Report',
    '',
    [esc('Organization'), esc(orgName)].join(','),
    [esc('Date'), esc(reportDate)].join(','),
    [esc('Overall score'), esc(overallScore != null ? String(overallScore) : '')].join(','),
    [esc('Predicted rating'), esc(predictedRating ? formatRatingLabel(predictedRating) : '')].join(','),
    '',
    ['Domain', 'Score', 'Rating', 'Gaps'].map(esc).join(','),
    ...domainRows.map((row) => row.map((cell) => esc(String(cell))).join(',')),
  ].join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="compliance-report.csv"',
    },
  });
});
