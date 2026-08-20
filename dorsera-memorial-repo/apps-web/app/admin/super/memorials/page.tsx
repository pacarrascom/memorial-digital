import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
 
export default async function SuperAdminMemorialsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
 
  const { data: isSuperAdmin } = await supabase.rpc('is_super_admin');
  if (!isSuperAdmin) {
    redirect('/admin');
  }
 
  const { data: memorials } = await supabase
    .from('memorials')
    .select(
      `
      id,
      slug,
      visibility,
      created_at,
      organization_id,
      person_profile(full_name, birth_date, death_date),
      organizations(name)
    `
    )
    .order('created_at', { ascending: false });
 
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700"
      >
        ← Volver al panel
      </Link>
 
      <h1 className="mb-1 font-display text-2xl text-ink-900">Todos los memoriales</h1>
      <p className="mb-6 text-sm text-ink-500">
        {memorials?.length ?? 0} memoriales en la plataforma
      </p>
 
      {!memorials || memorials.length === 0 ? (
        <p className="text-sm text-ink-400">No hay memoriales todavía.</p>
      ) : (
        <ul className="space-y-2">
          {memorials.map((m: any) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-900">
                  {m.person_profile?.full_name ?? 'Sin nombre'}
                </p>
                <p className="font-mono text-xs text-ink-400">
                  /{m.slug} · {m.organizations?.name ?? 'Individual'} ·{' '}
                  {new Date(m.created_at).toLocaleDateString('es-CL')}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-sm">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    m.visibility === 'publico'
                      ? 'bg-moss-600/10 text-moss-800'
                      : 'bg-stone-300 text-ink-700'
                  }`}
                >
                  {m.visibility === 'publico' ? 'Público' : 'Privado'}
                </span>
                <Link href={`/m/${m.slug}`} className="underline">
                  Ver
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
