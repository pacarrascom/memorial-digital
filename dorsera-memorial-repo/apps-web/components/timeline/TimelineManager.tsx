'use client';

import { useState, useTransition } from 'react';
import {
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
} from '@/lib/actions/timeline';

type TimelineEvent = {
  id: string;
  memorial_id: string;
  event_date: string | null;
  title: string;
  description: string | null;
  location: { nombre?: string } | null;
  sort_order: number | null;
  created_at: string;
};

export function TimelineManager({
  memorialId,
  initialEvents,
  canEdit,
}: {
  memorialId: string;
  initialEvents: TimelineEvent[];
  canEdit: boolean;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function closeForm() {
    setIsFormOpen(false);
    setEditingEvent(null);
    setError(null);
  }

  function handleSubmit(formData: FormData) {
    const title = String(formData.get('title') || '').trim();
    if (!title) {
      setError('El título es obligatorio.');
      return;
    }

    const payload = {
      eventDate: String(formData.get('eventDate') || ''),
      title,
      description: String(formData.get('description') || ''),
      locationName: String(formData.get('locationName') || ''),
    };

    setError(null);
    startTransition(async () => {
      const result = editingEvent
        ? await updateTimelineEvent(editingEvent.id, memorialId, payload)
        : await createTimelineEvent({ memorialId, ...payload });

      if (result?.error) {
        setError(result.error);
        return;
      }

      window.location.reload();
    });
  }

  function handleDelete(eventId: string) {
    if (!confirm('¿Eliminar este evento de la línea de tiempo?')) return;

    startTransition(async () => {
      const result = await deleteTimelineEvent(eventId, memorialId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-flame-200 bg-flame-50 px-4 py-3 text-sm text-flame-700">
          {error}
        </div>
      )}

      {canEdit && !isFormOpen && (
        <button
          onClick={() => setIsFormOpen(true)}
          className="w-full rounded-lg bg-moss-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-moss-700"
        >
          + Agregar evento
        </button>
      )}

      {isFormOpen && (
        <EventForm
          event={editingEvent}
          isPending={isPending}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      )}

      {events.length === 0 && !isFormOpen && (
        <p className="rounded-lg border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-ink-400">
          Todavía no hay eventos en esta línea de tiempo.
        </p>
      )}

      <ol className="space-y-3">
        {events.map((event) => (
          <li
            key={event.id}
            className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {event.event_date && (
                  <p className="font-mono text-xs text-ink-400">
                    {new Date(event.event_date + 'T00:00:00').toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
                <h3 className="font-display text-lg text-ink-900">{event.title}</h3>
                {event.location?.nombre && (
                  <p className="text-xs text-ink-400">📍 {event.location.nombre}</p>
                )}
                {event.description && (
                  <p className="mt-1 text-sm text-ink-600">{event.description}</p>
                )}
              </div>

              {canEdit && (
                <div className="flex shrink-0 gap-2 text-xs">
                  <button
                    onClick={() => {
                      setEditingEvent(event);
                      setIsFormOpen(true);
                    }}
                    className="text-ink-500 hover:text-ink-700 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    disabled={isPending}
                    className="text-flame-600 hover:text-flame-700 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function EventForm({
  event,
  isPending,
  onSubmit,
  onCancel,
}: {
  event: TimelineEvent | null;
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}) {
  return (
    <form
      action={onSubmit}
      className="space-y-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
    >
      <h3 className="font-display text-base text-ink-900">
        {event ? 'Editar evento' : 'Nuevo evento'}
      </h3>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-500">Fecha (opcional)</label>
        <input
          type="date"
          name="eventDate"
          defaultValue={event?.event_date ?? ''}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-ink-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-500">Título</label>
        <input
          type="text"
          name="title"
          required
          defaultValue={event?.title ?? ''}
          placeholder="Ej: Nacimiento, Matrimonio, Graduación..."
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-ink-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-500">Lugar (opcional)</label>
        <input
          type="text"
          name="locationName"
          defaultValue={event?.location?.nombre ?? ''}
          placeholder="Ej: Santiago, Chile"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-ink-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-500">Descripción (opcional)</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={event?.description ?? ''}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-ink-900"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-moss-600 px-4 py-2 text-sm font-medium text-white hover:bg-moss-700 disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="flex-1 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-stone-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
