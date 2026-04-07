import { getDb } from '@/lib/db';

export interface FileVersion {
  id: string;
  organizationId: string;
  evidenceItemId: string;
  kloeCode: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  expiresAt: string | null;
  isCurrent: boolean;
}

function mapRow(row: Record<string, unknown>): FileVersion {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    evidenceItemId: row.evidence_item_id as string,
    kloeCode: row.kloe_code as string,
    fileUrl: row.file_url as string,
    fileName: row.file_name as string,
    fileType: row.file_type as string,
    uploadedBy: row.uploaded_by as string,
    uploadedAt: row.uploaded_at as string,
    expiresAt: (row.expires_at as string) ?? null,
    isCurrent: row.is_current as boolean,
  };
}

export class EvidenceFileService {
  /** Get all versions for a specific evidence item (current first, then historical). */
  static async getVersions(organizationId: string, evidenceItemId: string): Promise<FileVersion[]> {
    const client = await getDb();
    const { data } = await client
      .from('evidence_file_versions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('evidence_item_id', evidenceItemId)
      .order('is_current', { ascending: false })
      .order('uploaded_at', { ascending: false });
    return (data ?? []).map(mapRow);
  }

  /** Get all versions for an org, optionally filtered by KLOE (includes historical). */
  static async getVersionsForKloe(organizationId: string, kloeCode?: string): Promise<FileVersion[]> {
    const client = await getDb();
    let query = client
      .from('evidence_file_versions')
      .select('*')
      .eq('organization_id', organizationId);
    if (kloeCode) query = query.eq('kloe_code', kloeCode);
    const { data } = await query
      .order('evidence_item_id')
      .order('is_current', { ascending: false })
      .order('uploaded_at', { ascending: false });
    return (data ?? []).map(mapRow);
  }

  /** Upload a new version — marks previous version as non-current. */
  static async addVersion(params: {
    organizationId: string;
    evidenceItemId: string;
    kloeCode: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    uploadedBy: string;
    expiresAt?: string | null;
  }): Promise<FileVersion> {
    const client = await getDb();

    await client
      .from('evidence_file_versions')
      .update({ is_current: false })
      .eq('organization_id', params.organizationId)
      .eq('evidence_item_id', params.evidenceItemId);

    const { data } = await client
      .from('evidence_file_versions')
      .insert({
        organization_id: params.organizationId,
        evidence_item_id: params.evidenceItemId,
        kloe_code: params.kloeCode,
        file_url: params.fileUrl,
        file_name: params.fileName,
        file_type: params.fileType,
        uploaded_by: params.uploadedBy,
        expires_at: params.expiresAt ?? null,
        is_current: true,
      })
      .select()
      .single();

    return mapRow(data as Record<string, unknown>);
  }
}
