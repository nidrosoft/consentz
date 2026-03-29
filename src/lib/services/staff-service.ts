// =============================================================================
// Staff Service — CRUD for staff members with training records
// =============================================================================

import { getDb } from '@/lib/db';

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

interface StaffListParams {
  organizationId: string;
  pagination: { page: number; limit: number; search?: string };
  filters?: {
    isActive?: boolean;
    department?: string | string[];
    staffRole?: string | string[];
  };
}

export class StaffService {
  static async list(params: StaffListParams) {
    const client = await getDb();
    const skip = (params.pagination.page - 1) * params.pagination.limit;

    function applyFilters(query: any) {
      let q = query
        .eq('organization_id', params.organizationId)
        .is('deleted_at', null);

      if (params.filters?.isActive !== undefined) {
        q = q.eq('is_active', params.filters.isActive);
      }
      if (params.filters?.department) {
        const depts = Array.isArray(params.filters.department) ? params.filters.department : [params.filters.department];
        q = q.in('department', depts);
      }
      if (params.filters?.staffRole) {
        const roles = Array.isArray(params.filters.staffRole) ? params.filters.staffRole : [params.filters.staffRole];
        q = q.in('staff_role', roles);
      }
      if (params.pagination.search) {
        const s = params.pagination.search.replace(/%/g, '\\%');
        q = q.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,job_title.ilike.%${s}%`);
      }
      return q;
    }

    const [{ data }, { count: total }] = await Promise.all([
      applyFilters(client.from('staff_members').select('*, training_records(*)'))
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true })
        .range(skip, skip + params.pagination.limit - 1),
      applyFilters(client.from('staff_members').select('*', { count: 'exact', head: true })),
    ]);

    const safeTotal = total ?? 0;

    return {
      data: data ?? [],
      meta: {
        page: params.pagination.page,
        limit: params.pagination.limit,
        total: safeTotal,
        totalPages: Math.ceil(safeTotal / params.pagination.limit),
      },
    };
  }

  static async getById(id: string) {
    const client = await getDb();
    const { data } = await client.from('staff_members')
      .select('*, training_records(*)')
      .eq('id', id)
      .maybeSingle();

    if (data?.training_records) {
      data.training_records.sort((a: any, b: any) => {
        const da = a.completed_date ?? '';
        const db_ = b.completed_date ?? '';
        return db_.localeCompare(da);
      });
    }

    return data;
  }

  static async create(params: {
    organizationId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    jobTitle: string;
    staffRole?: string;
    department?: string;
    startDate?: string;
    registrationBody?: string;
    registrationNumber?: string;
    registrationExpiry?: string;
    dbsNumber?: string;
    dbsCertificateDate?: string;
    dbsLevel?: string;
  }) {
    const client = await getDb();
    const { data } = await client.from('staff_members').insert({
      organization_id: params.organizationId,
      first_name: params.firstName,
      last_name: params.lastName,
      email: params.email,
      phone: params.phone,
      job_title: params.jobTitle,
      staff_role: params.staffRole || 'OTHER',
      department: params.department,
      start_date: params.startDate ? new Date(params.startDate).toISOString() : new Date().toISOString(),
      registration_body: params.registrationBody,
      registration_number: params.registrationNumber,
      registration_expiry: params.registrationExpiry ? new Date(params.registrationExpiry).toISOString() : null,
      dbs_number: params.dbsNumber,
      dbs_certificate_date: params.dbsCertificateDate ? new Date(params.dbsCertificateDate).toISOString() : null,
      dbs_level: params.dbsLevel,
    }).select().single();
    return data;
  }

  static async update(id: string, data: Record<string, unknown>) {
    const dateFields = ['start_date', 'end_date', 'registration_expiry', 'dbs_certificate_date', 'insurance_expiry', 'right_to_work_date'];
    const snakeData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      snakeData[camelToSnake(key)] = value;
    }
    for (const field of dateFields) {
      if (snakeData[field]) snakeData[field] = new Date(snakeData[field] as string).toISOString();
    }
    const client = await getDb();
    const { data: updated } = await client.from('staff_members')
      .update(snakeData)
      .eq('id', id)
      .select()
      .single();
    return updated;
  }

  static async softDelete(id: string) {
    const client = await getDb();
    await client.from('staff_members')
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq('id', id);
    return true;
  }
}
