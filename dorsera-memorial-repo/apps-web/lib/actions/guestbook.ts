'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function moderateGuestbookEntry(
  entryId: string,
  memorialId: string,
  status: 'aprobado' | 'rechazado'
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'No autenticado.' };
  }

  const { error } = await supabase
    .from('guestbook_entries')
    .update({
      moderation_status: status,
      moderated_by: user.id,
      moderated_at: new Date().toISOString(),
    })
    .eq('id', entryId);

  if (error) {
    console.error('moderateGuestbookEntry error:', error);
    return { error: 'No se pudo actualizar el mensaje. Verifica tus permisos sobre este memorial.' };
  }

  revalidatePath(`/admin/memorials/${memorialId}/guestbook`);
  revalidatePath(`/m`);
  return { success: true };
}
