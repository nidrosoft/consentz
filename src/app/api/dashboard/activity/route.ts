import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { parsePagination } from '@/lib/pagination';
import { getDb } from '@/lib/db';

export const GET = withAuth(async (req, { params, auth }) => {
  const { searchParams } = new URL(req.url);
  const pagination = parsePagination(searchParams);
  const client = await getDb();

  const from = (pagination.page - 1) * pagination.pageSize;
  const to = from + pagination.pageSize - 1;

  let query = client.from('activity_logs')
    .select('*', { count: 'exact' })
    .eq('organization_id', auth.organizationId);

  if (pagination.search) {
    const pattern = `%${pagination.search}%`;
    query = query.or(`description.ilike.${pattern},action.ilike.${pattern},actor_name.ilike.${pattern}`);
  }

  const { data: items, count: total } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalCount = total ?? 0;
  const totalPages = Math.ceil(totalCount / pagination.pageSize);

  const entries = items ?? [];

  // Enrich with kloe_code from related entities
  const kloeEntityTypes = ['EVIDENCE', 'TASK', 'GAP'];
  const kloeEntities = entries
    .filter((a) => kloeEntityTypes.includes(a.entity_type) && a.entity_id)
    .map((a) => ({ type: a.entity_type, id: a.entity_id }));

  const kloeMap = new Map<string, string>();
  if (kloeEntities.length > 0) {
    const evidenceIds = kloeEntities.filter((e) => e.type === 'EVIDENCE').map((e) => e.id);
    const taskIds = kloeEntities.filter((e) => e.type === 'TASK').map((e) => e.id);
    const gapIds = kloeEntities.filter((e) => e.type === 'GAP').map((e) => e.id);

    const [evidenceKloes, taskKloes, gapKloes] = await Promise.all([
      evidenceIds.length > 0
        ? client.from('evidence_items').select('id, kloe_code').in('id', evidenceIds)
        : { data: [] },
      taskIds.length > 0
        ? client.from('tasks').select('id, kloe_code').in('id', taskIds)
        : { data: [] },
      gapIds.length > 0
        ? client.from('compliance_gaps').select('id, kloe_code').in('id', gapIds)
        : { data: [] },
    ]);

    for (const row of [...(evidenceKloes.data ?? []), ...(taskKloes.data ?? []), ...(gapKloes.data ?? [])]) {
      if (row.kloe_code) kloeMap.set(row.id, row.kloe_code);
    }
  }

  const data = entries.map((entry) => ({
    id: entry.id,
    action: entry.action,
    description: entry.description,
    user: entry.actor_name,
    createdAt: entry.created_at,
    entityType: entry.entity_type,
    kloeCode: entry.entity_id ? (kloeMap.get(entry.entity_id) ?? null) : null,
  }));

  return apiSuccess(data, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: totalCount,
    totalPages,
    hasMore: pagination.page < totalPages,
  });
});
