'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function requestOrganization(name: string, contactEmail: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'No autenticado.' };
  }

  if (!name.trim()) {
    return { error: 'El nombre de la funeraria es obligatorio.' };
  }

  const { error } = await supabase.rpc('request_organization', {
    p_name: name,
    p_contact_email: contactEmail || null,
  });

  if (error) {
    console.error('requestOrganization error:', error);
    return { error: 'No se pudo enviar la solicitud. Intenta de nuevo.' };
  }

  revalidatePath('/admin');
  return { success: true };
}

export async function approveOrganization(organizationId: string) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('approve_organization', {
    p_organization_id: organizationId,
  });

  if (error) {
    console.error('approveOrganization error:', error);
    return { error: 'No se pudo aprobar la organización. Verifica que tengas permisos de administrador.' };
  }

  revalidatePath('/admin/super/organizations');
  return { success: true };
}

export async function rejectOrganization(organizationId: string) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('reject_organization', {
    p_organization_id: organizationId,
  });

  if (error) {
    console.error('rejectOrganization error:', error);
    return { error: 'No se pudo rechazar la organización.' };
  }

  revalidatePath('/admin/super/organizations');
  return { success: true };
}
