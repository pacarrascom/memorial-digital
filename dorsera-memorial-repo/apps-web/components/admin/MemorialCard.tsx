'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type MemorialCardProps = {
  memorialId: string;
  slug: string;
  fullName: string;
  birthDate: string | null;
  deathDate: string | null;
  visibility: 'publico' | 'privado' | 'solo_invitados';
  roleName: string;
};

const visibilityLabels: Record<string, { label: string; className: string }> = {
  publico: { label: 'Público', className: 'bg-moss-600/10 text-moss-800' },
  privado: { label: 'Privado', className: 'bg-stone-300 text-ink-700' },
  solo_invitados: { label: 'Solo invitados', className: 'bg-flame-600/10 text-flame-600' },
};

function getYear(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr + 'T00:00:00').getFullYear();
}

export function MemorialCard({
  memorialId,
  slug,
  fullName,
  birthDate,
  deathDate,
  visibility,
  roleName,
}: MemorialCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initial = fullName.trim().charAt(0).toUpperCase() || '?';
  const birthYear = getYear(birthDate);
  const deathYear = getYear(deathDate);
  const vis = visibilityLabels[visibility] ?? visibilityLabels.privado;

  return (
    <li className="flex items-center gap-4 rounded-lg border border-stone-300 bg-white p-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-moss-100 font-display text-lg text-moss-700">
        {initial}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-lg text-ink-900">{fullName}</p>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${vis.className}`}>
            {vis.label}
          </span>
        </div>
        <p className="font-mono text-xs text-ink-400">
          {birthYear && deathYear ? `${birthYear} – ${deathYear} · ` : ''}
          {roleName} · /{slug}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3 text-sm">
        <Link href={`/m/${slug}`} className="underline">
          Ver
        </Link>
        <Link href={`/admin/memorials/${memorialId}/edit`} className="underline">
          Editar
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Más opciones"
            aria-expanded={menuOpen}
            className="rounded-md p-1.5 text-ink-500 hover:bg-stone-100"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-10 mt-2 w-44 rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
              <Link
                href={`/admin/memorials/${memorialId}/qr`}
                className="block px-4 py-2 text-sm text-ink-700 hover:bg-stone-50"
                onClick={() => setMenuOpen(false)}
              >
                Código QR
              </Link>
              <Link
                href={`/admin/memorials/${memorialId}/gallery`}
                className="block px-4 py-2 text-sm text-ink-700 hover:bg-stone-50"
                onClick={() => setMenuOpen(false)}
              >
                Galería
              </Link>
              <Link
                href={`/admin/memorials/${memorialId}/timeline`}
                className="block px-4 py-2 text-sm text-ink-700 hover:bg-stone-50"
                onClick={() => setMenuOpen(false)}
              >
                Línea de tiempo
              </Link>
              <Link
                href={`/admin/memorials/${memorialId}/guestbook`}
                className="block px-4 py-2 text-sm text-ink-700 hover:bg-stone-50"
                onClick={() => setMenuOpen(false)}
              >
                Libro de recuerdos
              </Link>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
