import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { parsePagination } from '@/lib/pagination';
import { db } from '@/lib/db';

export const GET = withAuth(async (req, { params, auth }) => {
  const { searchParams } = new URL(req.url);
  const pagination = parsePagination(searchParams);

  const where: Record<string, unknown> = {
    organizationId: auth.organizationId,
  };

  if (pagination.search) {
    const query = pagination.search;
    where.OR = [
      { description: { contains: query, mode: 'insensitive' } },
      { action: { contains: query, mode: 'insensitive' } },
      { actorName: { contains: query, mode: 'insensitive' } },
    ];
  }

  const skip = (pagination.page - 1) * pagination.pageSize;
  const take = pagination.pageSize;

  const [items, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    db.activityLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pagination.pageSize);

  const data = items.map((entry) => ({
    id: entry.id,
    action: entry.action,
    description: entry.description,
    user: entry.actorName,
    createdAt: entry.createdAt.toISOString(),
    entityType: entry.entityType,
  }));

  return apiSuccess(data, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages,
    hasMore: pagination.page < totalPages,
  });
});
