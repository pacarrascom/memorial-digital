'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateQrAssets, generateShortCode } from '@/lib/qr/generate'

type GenerateQrResult =
  | { success: true; pngUrl: string; svgUrl: string; shortCode: string; publicUrl: string }
  | { success: false; error: string }

const STORAGE_BUCKET = 'memorial-assets'

export async function generateQrCode(memorialId: string): Promise<GenerateQrResult> {
  const supabase = await createClient()

  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) {
    return { success: false, error: 'No hay una sesión activa.' }
  }

  const { data: hasPermission, error: permError } = await supabase.rpc('has_memorial_role', {
    p_memorial_id: memorialId,
    p_roles: ['admin_familiar'],
  })

  if (permError) {
    return { success: false, error: `Error verificando permisos: ${permError.message}` }
  }

  if (!hasPermission) {
    return { success: false, error: 'No tienes permiso para generar el QR de este memorial.' }
  }

  const { data: memorial, error: memorialError } = await supabase
    .from('memorials')
    .select('id, slug')
    .eq('id', memorialId)
    .single()

  if (memorialError || !memorial) {
    return { success: false, error: 'No se encontró el memorial.' }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://memorial-digital-lac.vercel.app'
  const publicUrl = `${siteUrl}/m/${memorial.slug}`
  const shortCode = generateShortCode()
  const shortUrl = `${siteUrl}/q/${shortCode}`
  const { pngBuffer, svgString } = await generateQrAssets(shortUrl)

  const admin = createAdminClient()
  const pngPath = `qr/${memorialId}/qr.png`
  const svgPath = `qr/${memorialId}/qr.svg`

  const { error: pngUploadError } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(pngPath, pngBuffer, { contentType: 'image/png', upsert: true })

  if (pngUploadError) {
    return { success: false, error: `Error subiendo PNG: ${pngUploadError.message}` }
  }

  const { error: svgUploadError } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(svgPath, new Blob([svgString], { type: 'image/svg+xml' }), {
      contentType: 'image/svg+xml',
      upsert: true,
    })

  if (svgUploadError) {
    return { success: false, error: `Error subiendo SVG: ${svgUploadError.message}` }
  }

  const { data: pngPublic } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(pngPath)
  const { data: svgPublic } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(svgPath)

  const { error: upsertError } = await admin.from('qr_codes').upsert(
    {
      memorial_id: memorialId,
      public_url: publicUrl,
      short_code: shortCode,
      png_path: pngPublic.publicUrl,
      svg_path: svgPublic.publicUrl,
    },
    { onConflict: 'memorial_id' }
  )

  if (upsertError) {
    return { success: false, error: `Error guardando en la base de datos: ${upsertError.message}` }
  }

  revalidatePath(`/admin`)

  return {
    success: true,
    pngUrl: pngPublic.publicUrl,
    svgUrl: svgPublic.publicUrl,
    shortCode,
    publicUrl,
  }
}
