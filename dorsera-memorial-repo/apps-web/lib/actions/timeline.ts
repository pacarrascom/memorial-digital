'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type TimelineEventInput = {
  memorialId: string;
  eventDate?: string | null;
  title: string;
  description?: string | null;
  locationName?: string | null;
};

function parseLocation(locationName?: string | null) {
  if (!locationName || !locationName.trim()) return null;
  return { nombre: locationName.trim() };
}

export async function createTimelineEvent(input: TimelineEventInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'No autenticado.' };
  }

  const { error } = await supabase.from('timeline_events').insert({
    memorial_id: input.memorialId,
    event_date: input.eventDate || null,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    location: parseLocation(input.locationName),
  });

  if (error) {
    console.error('createTimelineEvent error:', error);
    return { error: 'No se pudo crear el evento. Verifica que tengas permisos sobre este memorial.' };
  }

  revalidatePath(`/admin/memorials/${input.memorialId}/timeline`);
  return { success: true };
}

export async function updateTimelineEvent(
  eventId: string,
  memorialId: string,
  input: Omit<TimelineEventInput, 'memorialId'>
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('timeline_events')
    .update({
      event_date: input.eventDate || null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      location: parseLocation(input.locationName),
    })
    .eq('id', eventId);

  if (error) {
    console.error('updateTimelineEvent error:', error);
    return { error: 'No se pudo actualizar el evento.' };
  }

  revalidatePath(`/admin/memorials/${memorialId}/timeline`);
  return { success: true };
}

export async function deleteTimelineEvent(eventId: string, memorialId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('timeline_events').delete().eq('id', eventId);

  if (error) {
    console.error('deleteTimelineEvent error:', error);
    return { error: 'No se pudo eliminar el evento.' };
  }

  revalidatePath(`/admin/memorials/${memorialId}/timeline`);
  return { success: true };
}
