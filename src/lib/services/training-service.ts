// =============================================================================
// Training Service — CRUD and training matrix generation
// =============================================================================

import { getDb } from '@/lib/db';
import type { PaginationInput } from '@/lib/pagination';
import type { PaginationMeta } from '@/lib/api-response';

function deriveTrainingStatus(expiryDate: Date | null, isExpired: boolean): string {
  if (isExpired) return 'EXPIRED';
  if (!expiryDate) return 'VALID';
  const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  if (expiryDate <= thirtyDays) return 'EXPIRING_SOON';
  return 'VALID';
}

interface TrainingListParams {
  organizationId: string;
  pagination: PaginationInput;
  filters?: {
    staffId?: string;
    status?: string | string[];
    courseName?: string;
  };
}

interface TrainingCreateParams {
  organizationId: string;
  staffId: string;
  courseName: string;
  completedDate: string;
  expiryDate: string;
  certificateUrl?: string | null;
  status?: string;
}

interface TrainingUpdateParams {
  id: string;
  courseName?: string;
  completedDate?: string;
  expiryDate?: string;
  certificateUrl?: string | null;
  status?: string;
}

export class TrainingService {
  static async listAll(params: TrainingListParams) {
    const client = await getDb();
    const skip = (params.pagination.page - 1) * params.pagination.pageSize;

    function applyFilters(query: any) {
      let q = query.eq('staff_members.organization_id', params.organizationId);

      if (params.filters?.staffId) {
        q = q.eq('staff_member_id', params.filters.staffId);
      }
      if (params.filters?.courseName) {
        q = q.ilike('course_name', `%${params.filters.courseName}%`);
      }
      if (params.pagination.search) {
        q = q.ilike('course_name', `%${params.pagination.search}%`);
      }
      return q;
    }

    const [{ data: rawData }, { count: total }] = await Promise.all([
      applyFilters(
        client.from('training_records')
          .select('*, staff_members!inner(first_name, last_name)'),
      )
        .order('completed_date', { ascending: false })
        .range(skip, skip + params.pagination.pageSize - 1),
      applyFilters(
        client.from('training_records')
          .select('*, staff_members!inner()', { count: 'exact', head: true }),
      ),
    ]);

    const data = (rawData ?? []).map((r: any) => ({
      ...r,
      status: deriveTrainingStatus(
        r.expiry_date ? new Date(r.expiry_date) : null,
        r.is_expired,
      ),
      staffName: `${r.staff_members.first_name} ${r.staff_members.last_name}`,
    }));

    if (params.filters?.status) {
      const statuses = Array.isArray(params.filters.status) ? params.filters.status : [params.filters.status];
      const filtered = data.filter((d: any) => statuses.includes(d.status));
      const totalPages = Math.ceil(filtered.length / params.pagination.pageSize);
      return {
        data: filtered,
        meta: { page: params.pagination.page, pageSize: params.pagination.pageSize, total: filtered.length, totalPages, hasMore: params.pagination.page < totalPages } as PaginationMeta,
      };
    }

    const safeTotal = total ?? 0;
    const totalPages = Math.ceil(safeTotal / params.pagination.pageSize);
    return {
      data,
      meta: { page: params.pagination.page, pageSize: params.pagination.pageSize, total: safeTotal, totalPages, hasMore: params.pagination.page < totalPages } as PaginationMeta,
    };
  }

  static async getById(id: string) {
    const client = await getDb();
    const { data: record } = await client.from('training_records')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!record) return null;
    return {
      ...record,
      status: deriveTrainingStatus(
        record.expiry_date ? new Date(record.expiry_date) : null,
        record.is_expired,
      ),
    };
  }

  static async create(params: TrainingCreateParams) {
    const expiryDate = params.expiryDate ? new Date(params.expiryDate).toISOString() : null;
    const client = await getDb();
    const { data } = await client.from('training_records').insert({
      staff_member_id: params.staffId,
      course_name: params.courseName,
      completed_date: new Date(params.completedDate).toISOString(),
      expiry_date: expiryDate,
      certificate_url: params.certificateUrl ?? null,
      is_expired: params.status === 'EXPIRED',
    }).select().single();
    return data;
  }

  static async update(params: TrainingUpdateParams) {
    const updateData: Record<string, unknown> = {};
    if (params.courseName !== undefined) updateData.course_name = params.courseName;
    if (params.completedDate !== undefined) updateData.completed_date = new Date(params.completedDate).toISOString();
    if (params.expiryDate !== undefined) updateData.expiry_date = new Date(params.expiryDate).toISOString();
    if (params.certificateUrl !== undefined) updateData.certificate_url = params.certificateUrl;
    if (params.status === 'EXPIRED') updateData.is_expired = true;
    if (params.status === 'VALID') updateData.is_expired = false;

    const client = await getDb();
    const { data } = await client.from('training_records')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();
    return data;
  }

  static async delete(id: string) {
    const client = await getDb();
    await client.from('training_records').delete().eq('id', id);
    return true;
  }

  static async getMatrix(organizationId: string) {
    const client = await getDb();
    const { data: activeStaff } = await client.from('staff_members')
      .select('id, first_name, last_name, training_records(course_name, expiry_date, is_expired)')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('first_name', { ascending: true });

    const staffRows = (activeStaff ?? []).map((member: any) => ({
      id: member.id,
      name: `${member.first_name} ${member.last_name}`,
      trainings: (member.training_records ?? []).map((t: any) => ({
        courseName: t.course_name,
        status: deriveTrainingStatus(
          t.expiry_date ? new Date(t.expiry_date) : null,
          t.is_expired,
        ),
        expiryDate: t.expiry_date ?? '',
      })),
    }));

    return { staff: staffRows };
  }
}
