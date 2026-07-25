import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
  redirect(`/m/${slug}`)
}
