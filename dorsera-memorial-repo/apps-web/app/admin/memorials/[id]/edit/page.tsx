import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditProfileForm } from '@/components/admin/EditProfileForm'

type PageProps = { params: Promise<{ id: string }> }

export default async function EditMemorialPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: memorial, error } = await supabase
    .from('memorials')
    .select('id, slug, person_profile(full_name, birth_date, death_date, birth_place, biography)')
    .eq('id', id)
    .maybeSingle()

  if (error || !memorial) {
    notFound()
  }

  const person = Array.isArray(memorial.person_profile)
    ? memorial.person_profile[0]
    : memorial.person_profile

  return (
    <div className="mx-auto max-w-lg">
      <a href="/admin" className="mb-4 inline-block text-sm text-ink-400 hover:text-ink-700">
        ← Volver al panel
      </a>
      <h1 className="mb-8 font-display text-2xl text-ink-900 dark:text-stone-50">
        Editar memorial
      </h1>
      <EditProfileForm
        memorialId={memorial.id}
        slug={memorial.slug}
        initial={{
          full_name: person?.full_name ?? '',
          birth_date: person?.birth_date ?? null,
          death_date: person?.death_date ?? null,
          birth_place: person?.birth_place ?? null,
          biography: person?.biography ?? null,
        }}
      />
    </div>
  )
}
