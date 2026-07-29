import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MemorialCard } from "@/components/admin/MemorialCard";

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
        visibility,
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
            <MemorialCard
              key={r.memorial?.id}
              memorialId={r.memorial?.id}
              slug={r.memorial?.slug}
              fullName={r.memorial?.person_profile?.full_name ?? "Sin nombre"}
              birthDate={r.memorial?.person_profile?.birth_date ?? null}
              deathDate={r.memorial?.person_profile?.death_date ?? null}
              visibility={r.memorial?.visibility ?? "privado"}
              roleName={r.role?.name ?? ""}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
