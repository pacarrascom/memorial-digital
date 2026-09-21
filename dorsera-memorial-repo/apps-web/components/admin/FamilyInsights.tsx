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
  icon,
  label,
  value,
  note,
}: {
  icon: string;
  label: string;
  value: number;
  note?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-stone-300 bg-white p-4">
      <div className="flex items-center gap-2 text-sm text-ink-500">
        <span aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-ink-900">{value.toLocaleString("es-CL")}</p>
      {note}
    </div>
  );
}

// Panel de insights para el administrador familiar: un resumen de cómo la
// comunidad está interactuando con sus memoriales. Sin gráficos ni deltas —
// no hay histórico de visitas todavía (no existe tracking de analítica);
// son conteos actuales, tratados con la misma calma editorial del resto
// del producto (nada gamificado).
export function FamilyInsights({ data }: { data: FamilyInsightsData }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-ink-400">
        Resumen
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile icon="🕯️" label="Velas encendidas" value={data.candles} />
        <StatTile icon="🌸" label="Flores y cariño" value={data.reactions} />
        <StatTile icon="💬" label="Mensajes recibidos" value={data.tributesTotal} />
        <StatTile
          icon="📝"
          label="Por moderar"
          value={data.tributesPending}
          note={
            data.tributesPending > 0 ? (
              <p className="mt-1 text-xs text-flame-600">Hay mensajes esperando tu revisión</p>
            ) : undefined
          }
        />
        <StatTile icon="📷" label="Fotos y recuerdos" value={data.media} />
      </div>
      {data.timelineEvents > 0 && (
        <p className="mt-3 text-xs text-ink-400">
          {data.timelineEvents} {data.timelineEvents === 1 ? "evento" : "eventos"} en la línea de
          tiempo.
        </p>
      )}
    </div>
  );
}
