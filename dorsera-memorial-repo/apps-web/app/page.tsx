import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/admin');
  }

  return (
    <main>
      <section className="mx-auto max-w-3xl px-6 py-20 sm:px-8 sm:py-28">
        <div className="ribbon-of-light pl-8">
          <h1 className="text-3xl leading-tight text-ink-900 sm:text-4xl">
            Un lugar donde las historias de quienes amamos siguen vivas.
          </h1>
          <p className="mt-5 max-w-xl text-base text-ink-700 sm:text-lg">
            Dorsera Memorial es un espacio digital para guardar fotografías, recuerdos
            y momentos — y compartirlos con quienes también los aman, hoy y en el futuro.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-ink-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ink-700"
            >
              Comenzar un memorial
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-stone-100"
            >
              Ya tengo una cuenta
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-ash bg-white px-6 py-16 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-xl text-ink-900 sm:text-2xl">Cómo funciona</h2>

          <ol className="space-y-8">
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-moss-600/10 font-mono text-sm text-moss-800">
                1
              </span>
              <div>
                <h3 className="text-base text-ink-900">Cuéntanos su historia</h3>
                <p className="mt-1 text-sm text-ink-600">
                  Crea el memorial con fotografías, fechas y los momentos que la definieron.
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-moss-600/10 font-mono text-sm text-moss-800">
                2
              </span>
              <div>
                <h3 className="text-base text-ink-900">Compártelo donde esté</h3>
                <p className="mt-1 text-sm text-ink-600">
                  Genera un código QR para colocar junto a su lugar de descanso,
                  o compártelo directamente con la familia.
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-moss-600/10 font-mono text-sm text-moss-800">
                3
              </span>
              <div>
                <h3 className="text-base text-ink-900">Que siga creciendo</h3>
                <p className="mt-1 text-sm text-ink-600">
                  Familiares y amigos pueden dejar recuerdos y encender una vela
                  en su memoria, en cualquier momento.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <footer className="px-6 py-10 text-center sm:px-8">
        <p className="font-mono text-xs text-ink-400">Dorsera Memorial</p>
      </footer>
    </main>
  );
}
