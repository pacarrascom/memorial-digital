import type { ReactNode } from 'react';

// Fase 2 del refactor (2026-09-21): consolidado de 5 anchos literales de
// Tailwind (lg/xl/2xl/3xl/6xl) a 3 tokens semánticos, según el tipo de
// contenido que cada página realmente muestra (auditoría completa de las
// 13 páginas en el PR de esta fase). xl se fusionó en "form" (era el
// mismo tipo de contenido que los otros 3 formularios angostos,
// verificado visualmente antes de mover
// /admin/organizations/[orgId]/memorials/new). 3xl se fusionó en
// "content" (verificado visualmente que el listado de
// /admin/super/memorials no pierde legibilidad en max-w-2xl).
const MAX_WIDTHS = {
  // Formularios angostos de una columna.
  form: 'max-w-lg',
  // Todo lo demás: listados, tablas, galerías, vistas de detalle.
  content: 'max-w-2xl',
  // El dashboard, con su grid de tarjetas de memorial.
  dashboard: 'max-w-6xl',
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
