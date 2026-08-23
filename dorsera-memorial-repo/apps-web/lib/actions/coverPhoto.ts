'use server'
 
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
 
export async function setCoverPhoto(mediaId: string, memorialId: string) {
  const supabase = await createClient()
 
  const { error } = await supabase.rpc('set_cover_photo', {
    p_media_id: mediaId,
  })
 
  if (error) {
    console.error('setCoverPhoto error:', error)
    return { success: false, error: 'No se pudo establecer la foto de portada.' }
  }
 
  revalidatePath(`/admin/memorials/${memorialId}/gallery`)
  revalidatePath(`/m`)
  return { success: true }
}
