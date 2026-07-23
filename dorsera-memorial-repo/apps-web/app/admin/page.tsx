import { createClient } from "@/lib/supabase/server";

export default async function AdminHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from("family_group_members")
    .select("role, family_group:family_groups(id, name)")
    .eq("profile_id", user?.id ?? "");

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-ink-900 dark:text-stone-50">
        Tus memoriales
      </h1>

      {!memberships || memberships.length === 0 ? (
        <p className="text-ink-400 dark:text-ash-night">
          Aún no perteneces a ninguna familia gestionando un memorial. La creación de
          memoriales y la gestión de familia son el siguiente entregable.
        </p>
      ) : (
        <ul className="space-y-2">
          {memberships.map((m: any) => (
            <li key={m.family_group.id} className="text-ink-700 dark:text-stone-100">
              {m.family_group.name} — <span className="font-mono text-xs">{m.role}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
