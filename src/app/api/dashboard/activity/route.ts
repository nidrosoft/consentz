import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { parsePagination, paginateArray } from '@/lib/pagination';
import { activityLogStore } from '@/lib/mock-data/store';

export const GET = withAuth(async (req, { params, auth }) => {
  const { searchParams } = new URL(req.url);
  const pagination = parsePagination(searchParams);

  let items = activityLogStore.getAll();

  // Sort by createdAt descending
  items = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Apply search filter
  if (pagination.search) {
    const query = pagination.search.toLowerCase();
    items = items.filter(
      (entry) =>
        entry.description.toLowerCase().includes(query) ||
        entry.action.toLowerCase().includes(query) ||
        entry.user.toLowerCase().includes(query),
    );
  }

  const result = paginateArray(items, pagination);

  return apiSuccess(result.data, result.meta);
});
