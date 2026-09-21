"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { QrModal } from "./QrModal";
import { FREE_PHOTO_LIMIT, FREE_TIMELINE_LIMIT } from "@/lib/planLimits";

export type FamilyInsightsData = {
  candles: number;
  reactions: number;
  tributesTotal: number;
  tributesPending: number;
  media: number;
  timelineEvents: number;
  photosUnlimited: boolean;
  timelineUnlimited: boolean;
};

// Etiqueta sutil de "llegaste al límite gratuito" — deliberadamente neutra
// (stone/ink, no flame): es un aviso informativo, no una acción pendiente
// como "Por moderar". Mismo patrón de pill que ya usa "Portada" en
// GalleryUploadForm.
function FreePlanBadge() {
  return (
    <span className="mt-1 inline-block rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-medium text-ink-600">
      Plan gratuito
    </span>
  );
}

function StatTile({
  href,
  icon,
  label,
  value,
  displayValue,
  note,
  attention = false,
  ariaLabel,
}: {
  href: string;
  icon: string;
  label: string;
  value: number;
  // Texto a mostrar en vez del número solo (ej. "8/10 fotos") — para
  // memoriales del plan gratuito, que tienen tope. Si no se pasa, se
  // muestra el número tal cual, como siempre.
  displayValue?: string;
  note?: ReactNode;
  // "Por moderar" con valor > 0 es la única métrica que representa una
  // acción pendiente del usuario, no solo un dato informativo — se apoya
  // en el mismo acento flame que ya usa el resto del producto para
  // "necesita tu atención" (nota de este tile, estado "rechazado" del
  // guestbook), no un color nuevo ni un rojo de error.
  attention?: boolean;
  ariaLabel?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={
        attention
          ? "block rounded-lg border border-flame-400 bg-flame-600/5 p-4 transition-colors hover:border-flame-600 hover:bg-flame-600/10"
          : "block rounded-lg border border-stone-300 bg-white p-4 transition-colors hover:border-moss-400 hover:bg-stone-50"
      }
    >
      <div className={`flex items-center gap-2 text-sm ${attention ? "text-flame-600" : "text-ink-500"}`}>
        {attention && (
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-flame-600" />
        )}
        <span aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </div>
      <p
        className={`mt-2 text-2xl font-semibold ${attention ? "text-flame-600" : "text-ink-900"}`}
      >
        {displayValue ?? value.toLocaleString("es-CL")}
      </p>
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
  fullName,
  data,
}: {
  memorialId: string;
  slug: string;
  fullName?: string;
  data: FamilyInsightsData;
}) {
  const [qrOpen, setQrOpen] = useState(false);

  // Nadie lo visitó todavía: ni velas, ni flores/corazones, ni mensajes
  // (y por lo tanto tampoco hay nada por moderar). El contenido que la
  // familia subió (fotos, timeline) no cuenta para esto — es propio, no
  // visitas — así que sigue mostrándose igual más abajo.
  const noActivity = data.candles === 0 && data.reactions === 0 && data.tributesTotal === 0;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {noActivity ? (
          <div className="col-span-full flex flex-col items-start gap-3 rounded-lg border border-moss-400/30 bg-moss-600/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-700">
              Aún no ha recibido visitas. Comparte el código QR para que familiares y amigos
              puedan dejar su cariño.
            </p>
            <button
              type="button"
              onClick={() => setQrOpen(true)}
              className="shrink-0 rounded-full bg-moss-600 px-5 py-2 text-sm text-stone-50 transition-colors hover:bg-moss-800"
            >
              Compartir código QR
            </button>
            <QrModal
              open={qrOpen}
              onClose={() => setQrOpen(false)}
              memorialId={memorialId}
              personName={fullName}
            />
          </div>
        ) : (
          <>
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
              attention={data.tributesPending > 0}
              ariaLabel={
                data.tributesPending > 0
                  ? `${data.tributesPending} ${data.tributesPending === 1 ? "mensaje" : "mensajes"} por moderar, ver cola de moderación`
                  : "Sin mensajes por moderar"
              }
              note={
                data.tributesPending > 0 ? (
                  <p className="mt-1 text-xs text-flame-600">Esperando tu revisión</p>
                ) : undefined
              }
            />
          </>
        )}
        <StatTile
          href={`/admin/memorials/${memorialId}/gallery`}
          icon="📷"
          label="Fotos y recuerdos"
          value={data.media}
          displayValue={data.photosUnlimited ? undefined : `${data.media}/${FREE_PHOTO_LIMIT} fotos`}
          note={
            !data.photosUnlimited && data.media >= FREE_PHOTO_LIMIT ? <FreePlanBadge /> : undefined
          }
        />
      </div>
      {data.timelineEvents > 0 && (
        <p className="mt-3 text-xs text-ink-400">
          <Link
            href={`/admin/memorials/${memorialId}/timeline`}
            className="underline hover:text-ink-600"
          >
            {data.timelineUnlimited
              ? `${data.timelineEvents} ${data.timelineEvents === 1 ? "evento" : "eventos"} en la línea de tiempo`
              : `${data.timelineEvents}/${FREE_TIMELINE_LIMIT} eventos en la línea de tiempo`}
          </Link>
          {!data.timelineUnlimited && data.timelineEvents >= FREE_TIMELINE_LIMIT && (
            <span className="ml-2 align-middle">
              <FreePlanBadge />
            </span>
          )}
        </p>
      )}
    </div>
  );
}
