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

  const { data: maxOrder } = await supabase
    .from('timeline_events')
    .select('sort_order')
    .eq('memorial_id', input.memorialId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxOrder?.sort_order ?? 0) + 1;

  const { error } = await supabase.from('timeline_events').insert({
    memorial_id: input.memorialId,
    event_date: input.eventDate || null,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    location: parseLocation(input.locationName),
    sort_order: nextOrder,
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

export async function reorderTimelineEvent(
  eventId: string,
  memorialId: string,
  direction: 'up' | 'down'
) {
  const supabase = await createClient();

  const { data: events, error: fetchError } = await supabase
    .from('timeline_events')
    .select('id, sort_order')
    .eq('memorial_id', memorialId)
    .order('sort_order', { ascending: true });

  if (fetchError || !events) {
    return { error: 'No se pudo reordenar.' };
  }

  const index = events.findIndex((e) => e.id === eventId);
  if (index === -1) return { error: 'Evento no encontrado.' };

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= events.length) return { success: true };

  const current = events[index];
  const swap = events[swapIndex];

  const { error: error1 } = await supabase
    .from('timeline_events')
    .update({ sort_order: swap.sort_order })
    .eq('id', current.id);

  const { error: error2 } = await supabase
    .from('timeline_events')
    .update({ sort_order: current.sort_order })
    .eq('id', swap.id);

  if (error1 || error2) {
    return { error: 'No se pudo reordenar.' };
  }

  revalidatePath(`/admin/memorials/${memorialId}/timeline`);
  return { success: true };
}
