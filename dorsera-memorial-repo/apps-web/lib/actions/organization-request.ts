'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function adminCreateOrganization(
  userEmail: string,
  name: string,
  rut: string,
  contactEmail: string,
  contactPhone: string
) {
  const supabase = await createClient();

  if (!userEmail.trim() || !name.trim()) {
    return { error: 'El correo del usuario y el nombre de la funeraria son obligatorios.' };
  }

  const { error } = await supabase.rpc('admin_create_organization', {
    p_user_email: userEmail.trim(),
    p_name: name.trim(),
    p_rut: rut.trim() || null,
    p_contact_email: contactEmail.trim() || null,
    p_contact_phone: contactPhone.trim() || null,
  });

  if (error) {
    console.error('adminCreateOrganization error:', error);
    return {
      error: error.message.includes('No existe un usuario')
        ? 'No existe ningún usuario registrado con ese correo.'
        : 'No se pudo crear la cuenta de funeraria. Verifica que tengas permisos de administrador.',
    };
  }

  revalidatePath('/admin/super/organizations');
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
