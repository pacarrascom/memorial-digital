import { createClient } from '@/lib/supabase/server'
import { GalleryUploadForm } from '@/components/admin/GalleryUploadForm'

type PageProps = { params: Promise<{ id: string }> }

export default async function GalleryPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: photos } = await supabase
    .from('media_assets')
    .select('id, storage_path, caption')
    .eq('memorial_id', id)
    .eq('type', 'foto')
    .order('uploaded_at', { ascending: false })

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 font-display text-2xl text-ink-900 dark:text-stone-50">
        Galería de fotos
      </h1>
      <GalleryUploadForm memorialId={id} existingPhotos={photos ?? []} />
    </div>
  )
}
