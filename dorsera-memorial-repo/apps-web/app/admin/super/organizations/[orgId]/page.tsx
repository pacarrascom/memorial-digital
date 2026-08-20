import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
 
export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();
 
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
 
  const { data: isSuperAdmin } = await supabase.rpc('is_super_admin');
  if (!isSuperAdmin) {
    redirect('/admin');
  }
 
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, type, rut, contact_email, contact_phone, status, requested_at, subscription_active_until')
    .eq('id', orgId)
    .maybeSingle();
 
  if (!org) {
    notFound();
  }
 
  const { data: memorials } = await supabase
    .from('memorials')
    .select('id, slug, visibility, created_at, family_contact_name, family_contact_email, person_profile(full_name)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });
 
  const { data: credits } = await supabase
    .from('organization_credits')
    .select('quantity, purchased_at')
    .eq('organization_id', orgId)
    .order('purchased_at', { ascending: false });
 
  const { data: payments } = await supabase
    .from('payments')
    .select('id, type, amount_clp, status, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });
 
  const statusLabels: Record<string, string> = {
    pendiente: 'Pendiente',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
  };
 
  const statusStyles: Record<string, string> = {
    pendiente: 'bg-stone-300 text-ink-700',
    aprobada: 'bg-moss-600/10 text-moss-800',
    rechazada: 'bg-flame-600/10 text-flame-600',
  };
 
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/admin/super/organizations"
        className="mb-6 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700"
      >
        ← Volver a solicitudes
      </Link>
 
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink-900">{org.name}</h1>
          <p className="text-sm text-ink-500">Cuenta institucional</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
            statusStyles[org.status] ?? 'bg-stone-300 text-ink-700'
          }`}
        >
          {statusLabels[org.status] ?? org.status}
        </span>
      </div>
 
      <section className="mb-8 rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="mb-3 font-display text-base text-ink-900">Contacto</h2>
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-ink-400">RUT</dt>
            <dd className="text-ink-900">{org.rut ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-400">Correo de contacto</dt>
            <dd className="text-ink-900">{org.contact_email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-400">Teléfono</dt>
            <dd className="text-ink-900">{org.contact_phone ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-400">Solicitada el</dt>
            <dd className="text-ink-900">
              {org.requested_at ? new Date(org.requested_at).toLocaleDateString('es-CL') : '—'}
            </dd>
          </div>
        </dl>
      </section>
 
      <section className="mb-8 rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="mb-3 font-display text-base text-ink-900">Suscripción y cupos</h2>
        <p className="text-sm text-ink-600">
          Vigencia de suscripción:{' '}
          {org.subscription_active_until
            ? new Date(org.subscription_active_until).toLocaleDateString('es-CL')
            : 'Sin suscripción activa (pago pendiente de conectar)'}
        </p>
        {credits && credits.length > 0 ? (
          <ul className="mt-2 space-y-1 text-sm text-ink-600">
            {credits.map((c, i) => (
              <li key={i}>
                +{c.quantity} cupos — {new Date(c.purchased_at).toLocaleDateString('es-CL')}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ink-400">Sin bloques de cupos comprados.</p>
        )}
      </section>
 
      <section className="mb-8 rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="mb-3 font-display text-base text-ink-900">Pagos</h2>
        {payments && payments.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between">
                <span className="text-ink-700">
                  {p.type} — {new Date(p.created_at).toLocaleDateString('es-CL')}
                </span>
                <span className="font-mono text-ink-900">
                  ${p.amount_clp.toLocaleString('es-CL')} · {p.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-400">
            Sin pagos registrados todavía (el cobro real aún no está conectado).
          </p>
        )}
      </section>
 
      <section>
        <h2 className="mb-3 font-display text-base text-ink-900">
          Memoriales ({memorials?.length ?? 0})
        </h2>
        {!memorials || memorials.length === 0 ? (
          <p className="text-sm text-ink-400">Sin memoriales todavía.</p>
        ) : (
          <ul className="space-y-2">
            {memorials.map((m: any) => (
              <li
                key={m.id}
                className="rounded-lg border border-stone-200 bg-white p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-ink-900">{m.person_profile?.full_name ?? 'Sin nombre'}</span>
                  <Link href={`/m/${m.slug}`} className="underline">
                    Ver
                  </Link>
                </div>
                {(m.family_contact_name || m.family_contact_email) && (
                  <p className="mt-1 text-xs text-ink-400">
                    Familiar: {m.family_contact_name ?? '—'}
                    {m.family_contact_email && ` · ${m.family_contact_email}`}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
