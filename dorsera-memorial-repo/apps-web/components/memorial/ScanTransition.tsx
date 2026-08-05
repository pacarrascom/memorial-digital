'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const AUTO_ADVANCE_MS = 4000;

export function ScanTransition({
  slug,
  fullName,
  birthDate,
  deathDate,
}: {
  slug: string;
  fullName: string;
  birthDate: string | null;
  deathDate: string | null;
}) {
  const router = useRouter();
  const [advancing, setAdvancing] = useState(false);

  function goToMemorial() {
    if (advancing) return;
    setAdvancing(true);
    router.replace(`/m/${slug}`);
  }

  useEffect(() => {
    const timer = setTimeout(goToMemorial, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const birthYear = birthDate ? new Date(birthDate).getFullYear() : null;
  const deathYear = deathDate ? new Date(deathDate).getFullYear() : null;
  const dateRange = birthYear && deathYear ? `${birthYear} – ${deathYear}` : '';

  return (
    <main
      onClick={goToMemorial}
      className="flex min-h-screen cursor-pointer flex-col items-center justify-center bg-ink-900 px-6 text-center"
    >
      <div
        className="mb-8 h-3 w-3 rounded-full bg-flame-400 animate-candle-flicker"
        aria-hidden="true"
      />

      <p className="mb-3 text-sm text-stone-100/70">Tómate un momento</p>

      {fullName && (
        <h1 className="mb-2 font-display text-3xl text-stone-50 sm:text-4xl">
          {fullName}
        </h1>
      )}

      {dateRange && (
        <p className="mb-6 font-mono text-sm text-stone-100/60">{dateRange}</p>
      )}

      <p className="max-w-xs text-sm text-stone-100/70">
        Su historia te espera.
      </p>

      <p className="mt-10 text-xs text-stone-100/40">Toca para continuar</p>
    </main>
  );
}
