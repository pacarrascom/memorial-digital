import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { QrGenerator } from '@/components/admin/QrGenerator'

export default async function MemorialQrPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: memorialId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: person } = await supabase
    .from('person_profile')
    .select('full_name')
    .eq('memorial_id', memorialId)
    .maybeSingle()

  if (!person) {
    notFound()
  }

  const { data: qr } = await supabase
    .from('qr_codes')
    .select('png_path, svg_path, short_code, public_url')
    .eq('memorial_id', memorialId)
    .maybeSingle()

  const initialQr = qr
    ? {
        pngUrl: qr.png_path,
        svgUrl: qr.svg_path,
        shortCode: qr.short_code,
        publicUrl: qr.public_url,
      }
    : null

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700"
      >
        ← Volver al panel
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink-900">Código QR del memorial</h1>
        <p className="mt-1 text-sm text-ink-500">{person.full_name} — el puente hacia su historia</p>
      </div>

      <QrGenerator memorialId={memorialId} initialQr={initialQr} />
    </div>
  )
}
