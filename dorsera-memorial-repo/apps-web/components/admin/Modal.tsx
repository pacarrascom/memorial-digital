'use client';

import { useEffect, useRef, type ReactNode } from 'react';

// Diálogo genérico reutilizable, sobre el elemento nativo <dialog> — el
// proyecto no usa ninguna librería de diálogos (Radix, Headless UI, etc.),
// así que evitamos sumar una dependencia nueva. <dialog> da foco atrapado,
// cierre con Escape y backdrop gratis.
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      onClick={(e) => {
        // Un click que cae directo sobre el <dialog> (no sobre su
        // contenido interno) es un click en el backdrop.
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
      className="w-full max-w-lg rounded-lg border border-stone-300 bg-white p-0 backdrop:bg-ink-900/40 dark:border-ash-night dark:bg-ink-900"
    >
      <div className="max-h-[85vh] overflow-y-auto p-6">
        {title && (
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-display text-xl text-ink-900 dark:text-stone-50">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="shrink-0 rounded-md p-1 text-ink-400 hover:bg-stone-100 hover:text-ink-700"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </dialog>
  );
}
