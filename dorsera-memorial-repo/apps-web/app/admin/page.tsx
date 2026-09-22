import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MemorialCard } from "@/components/admin/MemorialCard";
import { AdminContainer } from "@/components/admin/AdminContainer";
import { UnlockButton } from "@/components/admin/UnlockButton";
import type { FamilyInsightsData } from "@/components/admin/FamilyInsights";

function emptyCounts() {
  return {
    candles: 0,
    reactions: 0,
    tributesTotal: 0,
    tributesPending: 0,
    media: 0,
    timelineEvents: 0,
    photosUnlimited: false,
    timelineUnlimited: false,
  };
}

function countBy(rows: { memorial_id: string }[] | null): Record<string, number> {
  return (rows ?? []).reduce((acc: Record<string, number>, row) => {
    acc[row.memorial_id] = (acc[row.memorial_id] ?? 0) + 1;
    return acc;
  }, {});
}

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

  const familyMemorialIds = (roles ?? [])
    .map((r: any) => r.memorial?.id)
    .filter(Boolean) as string[];

  let familyInsightsByMemorial: Record<string, FamilyInsightsData> = {};
  if (familyMemorialIds.length > 0) {
    const [candlesRows, reactionsRows, guestbookRows, mediaRows, timelineRows, entitlementRows] =
      await Promise.all([
        supabase.from("candles").select("memorial_id").in("memorial_id", familyMemorialIds),
        supabase.from("reactions").select("memorial_id").in("memorial_id", familyMemorialIds),
        supabase
          .from("guestbook_entries")
          .select("memorial_id, moderation_status")
          .in("memorial_id", familyMemorialIds),
        supabase.from("media_assets").select("memorial_id").in("memorial_id", familyMemorialIds),
        supabase.from("timeline_events").select("memorial_id").in("memorial_id", familyMemorialIds),
        supabase
          .from("memorial_entitlements")
          .select("memorial_id, photos_unlimited, timeline_unlimited")
          .in("memorial_id", familyMemorialIds),
      ]);

    const candlesById = countBy(candlesRows.data);
    const reactionsById = countBy(reactionsRows.data);
    const mediaById = countBy(mediaRows.data);
    const timelineById = countBy(timelineRows.data);
    const tributesTotalById = countBy(guestbookRows.data);
    const tributesPendingById = countBy(
      (guestbookRows.data ?? []).filter((r: any) => r.moderation_status === "pendiente")
    );
    const entitlementsById = (entitlementRows.data ?? []).reduce(
      (acc: Record<string, { photos_unlimited: boolean; timeline_unlimited: boolean }>, row: any) => {
        acc[row.memorial_id] = row;
        return acc;
      },
      {}
    );

    familyInsightsByMemorial = familyMemorialIds.reduce((acc: Record<string, FamilyInsightsData>, id) => {
      acc[id] = {
        ...emptyCounts(),
        candles: candlesById[id] ?? 0,
        reactions: reactionsById[id] ?? 0,
        tributesTotal: tributesTotalById[id] ?? 0,
        tributesPending: tributesPendingById[id] ?? 0,
        media: mediaById[id] ?? 0,
        timelineEvents: timelineById[id] ?? 0,
        photosUnlimited: entitlementsById[id]?.photos_unlimited ?? false,
        timelineUnlimited: entitlementsById[id]?.timeline_unlimited ?? false,
      };
      return acc;
    }, {});
  }

  const { data: orgRoles } = await supabase
    .from("user_roles")
    .select("organization_id, organizations(id, name, subscription_active_until)")
    .eq("user_id", user?.id ?? "")
    .not("organization_id", "is", null);

  const organizations = (orgRoles ?? [])
    .map((r: any) => r.organizations)
    .filter(Boolean);

  let orgCredits: Record<string, number> = {};
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
        family_contact_name,
        family_contact_email,
        family_contact_phone,
        person_profile(full_name, birth_date, death_date)
      `
      )
      .in("organization_id", orgIds);
    orgMemorials = data ?? [];

    const { data: creditsData } = await supabase
      .from("organization_credits")
      .select("organization_id, quantity")
      .in("organization_id", orgIds);
    orgCredits = (creditsData ?? []).reduce((acc: Record<string, number>, c: any) => {
      acc[c.organization_id] = (acc[c.organization_id] ?? 0) + c.quantity;
      return acc;
    }, {});
  }

  const { data: pendingRequests } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("requested_by", user?.id ?? "")
    .eq("status", "pendiente");

  const { data: isSuperAdmin } = await supabase.rpc("is_super_admin");
  const isFuneraria = user?.user_metadata?.account_type === "funeraria";

  return (
    <AdminContainer size="dashboard">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink-900 dark:text-stone-50">
          Tus memoriales
        </h1>
        {!isFuneraria && (
          <Link
          href="/admin/memorials/new"
          className="rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink-700"
        >
          + Comenzar un memorial
        </Link>
        )}
      </div>

      {isSuperAdmin && (
        <div className="mb-6 flex flex-wrap gap-4">
          <Link
            href="/admin/super/organizations"
            className="text-sm text-ink-500 underline hover:text-ink-700"
          >
            Panel de solicitudes de funerarias
          </Link>
          <Link
            href="/admin/super/memorials"
            className="text-sm text-ink-500 underline hover:text-ink-700"
          >
            Ver todos los memoriales
          </Link>
        </div>
      )}

      {pendingRequests && pendingRequests.length > 0 && (
        <div className="mb-6 space-y-2">
          {pendingRequests.map((r: any) => (
            <div
              key={r.id}
              className="rounded-lg border border-stone-300 bg-stone-100 px-4 py-3 text-sm text-ink-600"
            >
              Tu solicitud para <strong>{r.name}</strong> está en revisión.
            </div>
          ))}
        </div>
      )}

      {!isFuneraria && (
        !roles || roles.length === 0 ? (
        <p className="text-ink-400 dark:text-ash-night">
          Cuando estés listo, puedes crear el primer espacio para honrar a alguien que amas.
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
              insights={r.memorial?.id ? familyInsightsByMemorial[r.memorial.id] : undefined}
            />
          ))}
        </ul>
      )
      )}

      {organizations.map((org: any) => (
        <div key={org.id} className="mt-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl text-ink-900 dark:text-stone-50">
              {org.name}
            </h2>
            <div className="flex gap-2">
              <Link
                href={`/admin/organizations/${org.id}/memorials/bulk`}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-stone-100"
              >
                Carga masiva (CSV)
              </Link>
              <Link
                href={`/admin/organizations/${org.id}/memorials/new`}
                className="rounded-lg border border-ink-900 px-4 py-2 text-sm font-medium text-ink-900 transition hover:bg-stone-100"
              >
                + Crear memorial
              </Link>
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm text-ink-600">
              Suscripción:{" "}
              {org.subscription_active_until
                ? `activa hasta ${new Date(org.subscription_active_until).toLocaleDateString("es-CL")}`
                : "sin suscripción activa"}
              {" · "}
              {orgCredits[org.id] ?? 0} cupos disponibles
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <UnlockButton type="org_subscription" organizationId={org.id} />
              <UnlockButton type="org_extra_block" organizationId={org.id} />
            </div>
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
                
                  familyContactName={m.family_contact_name ?? null}
                  familyContactEmail={m.family_contact_email ?? null}
                  familyContactPhone={m.family_contact_phone ?? null}
                />
              ))}
            </ul>
          )}
        </div>
      ))}
    </AdminContainer>
  );
}
