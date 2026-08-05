'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type BulkMemorialRow = {
  full_name: string;
  birth_date?: string;
  death_date?: string;
  birth_place?: string;
  biography?: string;
};

export type BulkResult = {
  row_index: number;
  success: boolean;
  memorial_id: string | null;
  slug: string | null;
  error_message: string | null;
};

export async function bulkCreateMemorialsForOrg(
  organizationId: string,
  rows: BulkMemorialRow[]
): Promise<{ error?: string; results?: BulkResult[] }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'No autenticado.' };
  }

  if (!rows || rows.length === 0) {
    return { error: 'No hay filas para procesar.' };
  }

  if (rows.length > 200) {
    return { error: 'Máximo 200 memoriales por carga. Divide el archivo en partes más pequeñas.' };
  }

  const { data, error } = await supabase.rpc('create_memorials_bulk_for_org', {
    p_organization_id: organizationId,
    p_memorials: rows,
  });

  if (error) {
    console.error('bulkCreateMemorialsForOrg error:', error);
    return { error: 'No se pudo procesar la carga. Verifica tus permisos en esta organización.' };
  }

  revalidatePath('/admin');
  return { results: data as BulkResult[] };
}
