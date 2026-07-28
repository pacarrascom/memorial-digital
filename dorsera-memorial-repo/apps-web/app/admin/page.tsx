import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: roles } = await supabase
    .from("user_roles")
    .select(
      `
      role:roles(name),
      memorial:memorials(
        id,
        slug,
        person_profile(full_name, birth_date, death_date)
      )
    `
    )
    .eq("user_id", user?.id ?? "");

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink-900 dark:text-stone-50">
          Tus memoriales
        </h1>
        <Link
          href="/admin/memorials/new"
          className="rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink-700"
        >
          + Crear memorial
        </Link>
      </div>

      {!roles || roles.length === 0 ? (
        <p className="text-ink-400 dark:text-ash-night">
          Aún no tienes memoriales. Crea el primero para empezar.
        </p>
      ) : (
        <ul className="space-y-3">
          {roles.map((r: any) => (
            <li
              key={r.memorial?.id}
              className="flex items-center justify-between rounded-lg border border-stone-300 bg-white p-4"
            >
              <div>
                <p className="font-display text-lg text-ink-900">
                  {r.memorial?.person_profile?.full_name ?? "Sin nombre"}
                </p>
                <p className="font-mono text-xs text-ink-400">
                  {r.role?.name} &middot; /{r.memorial?.slug}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <Link href={`/m/${r.memorial?.slug}`} className="underline">
                  Ver
                </Link>
                <Link
                  href={`/admin/memorials/${r.memorial?.id}/edit`}
                  className="underline"
                >
                  Editar
                </Link>
                <Link
                  href={`/admin/memorials/${r.memorial?.id}/qr`}
                  className="underline"
                >
                  QR
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
