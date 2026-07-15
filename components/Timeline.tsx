interface TimelineEvent {
  id: string;
  event_date: string | null;
  title: string;
  description: string | null;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  if (!events?.length) {
    return <p className="text-sm text-ink/60">Aún no se han añadido eventos.</p>;
  }

  const sorted = [...events].sort(
    (a, b) => new Date(a.event_date ?? 0).getTime() - new Date(b.event_date ?? 0).getTime()
  );

  return (
    <ul className="space-y-4">
      {sorted.map((event) => (
        <li key={event.id} className="flex gap-4 items-baseline">
          <span className="font-mono text-xs text-flame min-w-[3rem]">
            {event.event_date ? new Date(event.event_date).getFullYear() : '—'}
          </span>
          <div>
            <p className="font-medium">{event.title}</p>
            {event.description && (
              <p className="text-sm text-ink/70">{event.description}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
