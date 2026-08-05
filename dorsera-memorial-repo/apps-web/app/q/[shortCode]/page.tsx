import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ScanTransition } from '@/components/memorial/ScanTransition';

type PageProps = { params: Promise<{ shortCode: string }> }

export default async function ShortCodeRedirect({ params }: PageProps) {
  const { shortCode } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('qr_codes')
    .select('memorial_id, memorials(slug)')
    .eq('short_code', shortCode)
    .maybeSingle()

  if (error || !data || !data.memorials) {
    notFound()
  }

  const slug = (data.memorials as unknown as { slug: string }).slug

  const { data: person } = await supabase
    .from('person_profile')
    .select('full_name, birth_date, death_date')
    .eq('memorial_id', data.memorial_id)
    .maybeSingle()

  return (
    <ScanTransition
      slug={slug}
      fullName={person?.full_name ?? ''}
      birthDate={person?.birth_date ?? null}
      deathDate={person?.death_date ?? null}
    />
  )
}
