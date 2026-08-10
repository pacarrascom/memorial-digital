import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Images,
  Clock,
  MessageCircleHeart,
  QrCode,
  Lock,
  Check,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/admin');
  }

  return (
    <main>
      {/* Hero */}
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

      {/* Qué es */}
      <section className="border-t border-ash bg-white px-6 py-16 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 font-mono text-xs uppercase tracking-wide text-ink-400">
            Qué es Dorsera Memorial
          </p>
          <h2 className="mb-4 text-xl text-ink-900 sm:text-2xl">
            Un espacio propio para que una vida no quede dispersa.
          </h2>
          <p className="max-w-2xl text-base text-ink-600">
            Reúne biografía, fotografías, momentos importantes y mensajes de quienes
            también recuerdan, en una página elegante y fácil de compartir por WhatsApp,
            redes sociales o un código QR físico. La familia mantiene el control: cada
            mensaje que llega se revisa antes de publicarse.
          </p>
        </div>
      </section>

      {/* Funciones */}
      <section className="border-t border-ash bg-stone-50 px-6 py-16 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-xl text-ink-900 sm:text-2xl">
            Todo lo que necesitas para honrar una historia
          </h2>

          <div className="grid gap-8 sm:grid-cols-2">
            <div className="flex gap-4">
              <BookOpen className="mt-1 shrink-0 text-moss-800" size={22} strokeWidth={1.75} />
              <div>
                <h3 className="text-base text-ink-900">Biografía cuidada</h3>
                <p className="mt-1 text-sm text-ink-600">
                  Historia, fechas, lugar de nacimiento y una descripción que presenta
                  una vida con respeto.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Images className="mt-1 shrink-0 text-moss-800" size={22} strokeWidth={1.75} />
              <div>
                <h3 className="text-base text-ink-900">Galería de fotografías</h3>
                <p className="mt-1 text-sm text-ink-600">
                  Un álbum con los momentos que la definieron, visible para quien
                  visite el memorial.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Clock className="mt-1 shrink-0 text-moss-800" size={22} strokeWidth={1.75} />
              <div>
                <h3 className="text-base text-ink-900">Línea de tiempo</h3>
                <p className="mt-1 text-sm text-ink-600">
                  Los momentos que marcaron su historia, ordenados automáticamente
                  por fecha.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <MessageCircleHeart className="mt-1 shrink-0 text-moss-800" size={22} strokeWidth={1.75} />
              <div>
                <h3 className="text-base text-ink-900">Libro de recuerdos moderado</h3>
                <p className="mt-1 text-sm text-ink-600">
                  Familiares y amigos dejan mensajes que la familia revisa antes de
                  que se hagan públicos.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <QrCode className="mt-1 shrink-0 text-moss-800" size={22} strokeWidth={1.75} />
              <div>
                <h3 className="text-base text-ink-900">Código QR digital e imprimible</h3>
                <p className="mt-1 text-sm text-ink-600">
                  Un puente entre el mundo físico y la historia: genera el QR y descarga
                  un PDF listo para imprimir junto a su lugar de descanso.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Lock className="mt-1 shrink-0 text-moss-800" size={22} strokeWidth={1.75} />
              <div>
                <h3 className="text-base text-ink-900">Privacidad configurable</h3>
                <p className="mt-1 text-sm text-ink-600">
                  Decide si el memorial es público o privado, y quién puede verlo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
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
                <h3 className="text-base text-ink-900">Revisa lo que llega</h3>
                <p className="mt-1 text-sm text-ink-600">
                  Cada recuerdo enviado por un visitante queda pendiente hasta que
                  tú lo apruebas.
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-moss-600/10 font-mono text-sm text-moss-800">
                4
              </span>
              <div>
                <h3 className="text-base text-ink-900">Que siga creciendo</h3>
                <p className="mt-1 text-sm text-ink-600">
                  El memorial queda disponible para que la familia y los amigos
                  vuelvan a visitarlo cuando quieran.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Planes */}
      <section className="border-t border-ash bg-stone-50 px-6 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-xl text-ink-900 sm:text-2xl">Planes</h2>
          <p className="mb-10 text-sm text-ink-500">
            Comienza gratis. Desbloquea solo lo que necesites.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Individual */}
            <div className="rounded-xl border border-stone-300 bg-white p-6">
              <h3 className="font-display text-lg text-ink-900">Individual</h3>
              <p className="mt-1 text-sm text-ink-500">Para familias</p>

              <p className="mt-4 font-display text-2xl text-ink-900">Gratis</p>
              <p className="text-xs text-ink-400">para comenzar</p>

              <ul className="mt-5 space-y-2 text-sm text-ink-700">
                <li className="flex gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-moss-600" />
                  Biografía y línea de tiempo (hasta 5 momentos)
                </li>
                <li className="flex gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-moss-600" />
                  Hasta 10 fotografías en la galería
                </li>
                <li className="flex gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-moss-600" />
                  Libro de recuerdos con moderación
                </li>
                <li className="flex gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-moss-600" />
                  Código QR digital y PDF para imprimir, siempre gratis
                </li>
              </ul>

              <div className="mt-6 space-y-2 border-t border-stone-200 pt-5 text-sm">
                <div className="flex items-center justify-between text-ink-600">
                  <span>Fotografías ilimitadas</span>
                  <span className="font-mono text-ink-900">$4.990</span>
                </div>
                <div className="flex items-center justify-between text-ink-600">
                  <span>Momentos ilimitados en línea de tiempo</span>
                  <span className="font-mono text-ink-900">$2.990</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-moss-600/10 px-3 py-2 text-moss-800">
                  <span className="font-medium">Pack Todo Incluido</span>
                  <span className="font-mono font-medium">$6.990</span>
                </div>
              </div>

              <Link
                href="/register"
                className="mt-6 block rounded-lg bg-ink-900 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-ink-700"
              >
                Comenzar gratis
              </Link>
            </div>

            {/* Funeraria */}
            <div className="rounded-xl border border-ink-900 bg-white p-6">
              <h3 className="font-display text-lg text-ink-900">Funeraria</h3>
              <p className="mt-1 text-sm text-ink-500">Cuenta institucional</p>

              <p className="mt-4 font-display text-2xl text-ink-900">$49.990</p>
              <p className="text-xs text-ink-400">al mes, incluye 25 memoriales</p>

              <ul className="mt-5 space-y-2 text-sm text-ink-700">
                <li className="flex gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-moss-600" />
                  Panel institucional compartido para todo el equipo
                </li>
                <li className="flex gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-moss-600" />
                  Alta masiva de memoriales vía CSV
                </li>
                <li className="flex gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-moss-600" />
                  Fotografías y línea de tiempo ilimitadas en cada memorial
                </li>
                <li className="flex gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-moss-600" />
                  Moderación de recuerdos centralizada
                </li>
              </ul>

              <div className="mt-6 border-t border-stone-200 pt-5 text-sm">
                <div className="flex items-center justify-between text-ink-600">
                  <span>Bloque adicional de 25 memoriales</span>
                  <span className="font-mono text-ink-900">$99.990</span>
                </div>
              </div>

              <Link
                href="/admin/organizations/request"
                className="mt-6 block rounded-lg border border-ink-900 px-4 py-2.5 text-center text-sm font-medium text-ink-900 transition hover:bg-stone-100"
              >
                Solicitar cuenta institucional
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ejemplo */}
      <section className="border-t border-ash bg-white px-6 py-16 text-center sm:px-8">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-3 text-xl text-ink-900 sm:text-2xl">
            Mira un memorial real
          </h2>
          <p className="mb-6 text-sm text-ink-600">
            Así se ve una historia contada con cuidado.
          </p>
          <Link
            href="/m/maria-gonzalez-test"
            className="inline-block rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-stone-100"
          >
            Ver memorial de ejemplo
          </Link>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-ash bg-stone-50 px-6 py-16 text-center sm:px-8">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-3 text-xl text-ink-900 sm:text-2xl">
            Comienza hoy, sin costo.
          </h2>
          <p className="mb-6 text-sm text-ink-600">
            Crea el primer espacio para honrar a alguien que amas.
          </p>
          <Link
            href="/register"
            className="inline-block rounded-lg bg-ink-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-ink-700"
          >
            Comenzar un memorial
          </Link>
        </div>
      </section>

      <footer className="border-t border-ash px-6 py-10 sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-xs text-ink-400">Dorsera Memorial</p>
          <nav className="flex flex-wrap gap-4 text-xs text-ink-500">
            <Link href="/login" className="hover:text-ink-700">Ingresar</Link>
            <Link href="/register" className="hover:text-ink-700">Crear cuenta</Link>
            <Link href="/m/maria-gonzalez-test" className="hover:text-ink-700">Ejemplo</Link>
            <Link href="/admin/organizations/request" className="hover:text-ink-700">Funerarias</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
