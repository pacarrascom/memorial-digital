import Link from "next/link";
import type { ReactNode } from "react";

export type FamilyInsightsData = {
  candles: number;
  reactions: number;
  tributesTotal: number;
  tributesPending: number;
  media: number;
  timelineEvents: number;
};

function StatTile({
  href,
  icon,
  label,
  value,
  note,
}: {
  href: string;
  icon: string;
  label: string;
  value: number;
  note?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-stone-300 bg-white p-4 transition-colors hover:border-moss-400 hover:bg-stone-50"
    >
      <div className="flex items-center gap-2 text-sm text-ink-500">
        <span aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-ink-900">{value.toLocaleString("es-CL")}</p>
      {note}
    </Link>
  );
}

// Grilla de insights de UN memorial: velas, reacciones, mensajes (con aviso
// si hay pendientes de moderar) y fotos, cada uno como link directo a su
// sección. Vive dentro de la tarjeta del memorial (ver MemorialCard) — no
// repite el nombre, que ya está en el header de esa tarjeta. Sin gráficos
// ni deltas: no hay histórico de visitas todavía (no existe tracking de
// analítica); son conteos actuales, con la misma calma editorial del resto
// del producto (nada gamificado).
export function MemorialInsights({
  memorialId,
  slug,
  data,
}: {
  memorialId: string;
  slug: string;
  data: FamilyInsightsData;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile
          href={`/m/${slug}#tributes-heading`}
          icon="🕯️"
          label="Velas encendidas"
          value={data.candles}
        />
        <StatTile
          href={`/m/${slug}#tributes-heading`}
          icon="🌸"
          label="Flores y cariño"
          value={data.reactions}
        />
        <StatTile
          href={`/admin/memorials/${memorialId}/guestbook`}
          icon="💬"
          label="Mensajes recibidos"
          value={data.tributesTotal}
        />
        <StatTile
          href={`/admin/memorials/${memorialId}/guestbook`}
          icon="📝"
          label="Por moderar"
          value={data.tributesPending}
          note={
            data.tributesPending > 0 ? (
              <p className="mt-1 text-xs text-flame-600">Esperando tu revisión</p>
            ) : undefined
          }
        />
        <StatTile
          href={`/admin/memorials/${memorialId}/gallery`}
          icon="📷"
          label="Fotos y recuerdos"
          value={data.media}
        />
      </div>
      {data.timelineEvents > 0 && (
        <p className="mt-3 text-xs text-ink-400">
          <Link
            href={`/admin/memorials/${memorialId}/timeline`}
            className="underline hover:text-ink-600"
          >
            {data.timelineEvents} {data.timelineEvents === 1 ? "evento" : "eventos"} en la línea
            de tiempo
          </Link>
        </p>
      )}
    </div>
  );
}
