'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type UploadPhotoResult =
  | { success: true; url: string }
  | { success: false; error: string }

const STORAGE_BUCKET = 'memorial-assets'
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

export async function uploadMemorialPhoto(
  memorialId: string,
  formData: FormData
): Promise<UploadPhotoResult> {
  const supabase = await createClient()

  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) {
    return { success: false, error: 'No hay una sesión activa.' }
  }

  const { data: hasPermission, error: permError } = await supabase.rpc('has_memorial_role', {
    p_memorial_id: memorialId,
    p_roles: ['admin_familiar', 'colaborador_familiar'],
  })

  if (permError) {
    return { success: false, error: `Error verificando permisos: ${permError.message}` }
  }

  if (!hasPermission) {
    return { success: false, error: 'No tienes permiso para subir fotos a este memorial.' }
  }

  const FREE_PHOTO_LIMIT = 10

  const { count: photoCount } = await supabase
    .from('media_assets')
    .select('id', { count: 'exact', head: true })
    .eq('memorial_id', memorialId)
    .eq('type', 'foto')

  const { data: entitlement } = await supabase
    .from('memorial_entitlements')
    .select('photos_unlimited')
    .eq('memorial_id', memorialId)
    .maybeSingle()

  if (!entitlement?.photos_unlimited && (photoCount ?? 0) >= FREE_PHOTO_LIMIT) {
    return {
      success: false,
      error: `Este memorial ya tiene ${FREE_PHOTO_LIMIT} fotos gratis. Desbloquea fotos ilimitadas para agregar más.`,
    }
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return { success: false, error: 'No se recibió ningún archivo.' }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: 'Formato no permitido. Usa JPG, PNG, WEBP o HEIC.' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'El archivo es demasiado grande (máximo 10MB).' }
  }

  const caption = (formData.get('caption') as string)?.trim() || null

  const admin = createAdminClient()
  const extension = file.name.split('.').pop() || 'jpg'
  const fileName = `${crypto.randomUUID()}.${extension}`
  const storagePath = `gallery/${memorialId}/${fileName}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    return { success: false, error: `Error subiendo la foto: ${uploadError.message}` }
  }

  const { data: publicUrlData } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath)

  const { error: insertError } = await admin.from('media_assets').insert({
    memorial_id: memorialId,
    type: 'foto',
    storage_path: publicUrlData.publicUrl,
    caption,
    uploaded_by: authData.user.id,
  })

  if (insertError) {
    return { success: false, error: `Error guardando en la base de datos: ${insertError.message}` }
  }

  revalidatePath(`/admin`)
  revalidatePath(`/m`)

  return { success: true, url: publicUrlData.publicUrl }
}
