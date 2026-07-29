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
    .eq("user_id", user?.id ?? "")
    .not("memorial_id", "is", null);

  const { data: orgRoles } = await supabase
    .from("user_roles")
    .select("organization_id, organizations(id, name)")
    .eq("user_id", user?.id ?? "")
    .not("organization_id", "is", null);

  const organizations = (orgRoles ?? [])
    .map((r: any) => r.organizations)
    .filter(Boolean);

  let orgMemorials: any[] = [];
  if (organizations.length > 0) {
    const orgIds = organizations.map((o: any) => o.id);
    const { data } = await supabase
      .from("memorials")
      .select(
        `
        id,
        slug,
        visibility,
        person_profile(full_name, birth_date, death_date)
      `
      )
      .in("organization_id", orgIds);
    orgMemorials = data ?? [];
  }

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

      {organizations.map((org: any) => (
        <div key={org.id} className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl text-ink-900 dark:text-stone-50">
              {org.name}
            </h2>
            <Link
              href={`/admin/organizations/${org.id}/memorials/new`}
              className="rounded-lg border border-ink-900 px-4 py-2 text-sm font-medium text-ink-900 transition hover:bg-stone-100"
            >
              + Crear memorial para {org.name}
            </Link>
          </div>

          {orgMemorials.length === 0 ? (
            <p className="text-sm text-ink-400">
              Sin memoriales todavía en esta organización.
            </p>
          ) : (
            <ul className="space-y-3">
              {orgMemorials.map((m: any) => (
                <MemorialCard
                  key={m.id}
                  memorialId={m.id}
                  slug={m.slug}
                  fullName={m.person_profile?.full_name ?? "Sin nombre"}
                  birthDate={m.person_profile?.birth_date ?? null}
                  deathDate={m.person_profile?.death_date ?? null}
                  visibility={m.visibility ?? "privado"}
                  roleName="funeraria"
                />
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
