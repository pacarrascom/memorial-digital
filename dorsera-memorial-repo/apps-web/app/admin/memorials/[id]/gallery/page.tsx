import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { GalleryUploadForm } from '@/components/admin/GalleryUploadForm'

type PageProps = { params: Promise<{ id: string }> }

export default async function GalleryPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: photos } = await supabase
    .from('media_assets')
    .select('id, storage_path, caption, is_cover')
    .eq('memorial_id', id)
    .eq('type', 'foto')
    .order('uploaded_at', { ascending: false })

  const { data: entitlement } = await supabase
    .from('memorial_entitlements')
    .select('photos_unlimited')
    .eq('memorial_id', id)
    .maybeSingle()

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin" className="mb-6 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700">
        ← Volver al panel
      </Link>
      <h1 className="mb-8 font-display text-2xl text-ink-900">
        Galería de fotos
      </h1>
      <GalleryUploadForm
        memorialId={id}
        existingPhotos={photos ?? []}
        photosUnlimited={entitlement?.photos_unlimited ?? false}
      />
    </div>
  )
}
