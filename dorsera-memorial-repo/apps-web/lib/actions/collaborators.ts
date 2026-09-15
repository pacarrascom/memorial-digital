'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type Collaborator = {
  user_id: string;
  email: string;
  role_name: 'admin_familiar' | 'colaborador_familiar';
  granted_at: string;
};

export async function listCollaborators(memorialId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('list_memorial_collaborators', {
    p_memorial_id: memorialId,
  });

  if (error) {
    console.error('listCollaborators error:', error);
    return { error: 'No se pudieron cargar los colaboradores.', data: null };
  }

  return { error: null, data: (data ?? []) as Collaborator[] };
}

export async function inviteCollaborator(memorialId: string, email: string) {
  const supabase = await createClient();

  if (!email.trim()) {
    return { error: 'Ingresa un correo.' };
  }

  const { error } = await supabase.rpc('invite_collaborator', {
    p_memorial_id: memorialId,
    p_email: email.trim(),
  });

  if (error) {
    console.error('inviteCollaborator error:', error);
    return { error: error.message || 'No se pudo invitar al colaborador.' };
  }

  revalidatePath(`/admin/memorials/${memorialId}/collaborators`);
  return { success: true };
}

export async function removeCollaborator(memorialId: string, userId: string) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('remove_collaborator', {
    p_memorial_id: memorialId,
    p_user_id: userId,
  });

  if (error) {
    console.error('removeCollaborator error:', error);
    return { error: 'No se pudo quitar al colaborador.' };
  }

  revalidatePath(`/admin/memorials/${memorialId}/collaborators`);
  return { success: true };
}
