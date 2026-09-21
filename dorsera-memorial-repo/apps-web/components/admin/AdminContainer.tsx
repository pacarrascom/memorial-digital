import type { ReactNode } from 'react';

// Un token por cada ancho que realmente existía copiado y pegado en las
// páginas de /admin (auditado 2026-09-21: lg, xl, 2xl, 3xl, 6xl — no
// forzar menos tokens de los que hay en uso real). El nombre del size es
// literal al valor de Tailwind a propósito, para que no haya ambigüedad
// entre "qué pedí" y "qué ancho sale".
const MAX_WIDTHS = {
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '6xl': 'max-w-6xl',
} as const;

export type AdminContainerSize = keyof typeof MAX_WIDTHS;

// Contenedor centrado compartido por todas las páginas de /admin. El
// padding lateral (px-4 sm:px-6 lg:px-8) vive en app/admin/layout.tsx,
// no acá — este componente solo centra y acota el ancho, nada más.
export function AdminContainer({
  size,
  children,
}: {
  size: AdminContainerSize;
  children: ReactNode;
}) {
  return <div className={`mx-auto ${MAX_WIDTHS[size]}`}>{children}</div>;
}
