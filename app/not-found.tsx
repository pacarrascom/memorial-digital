export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-32 text-center">
      <h1 className="font-display text-2xl">Este memorial no está disponible</h1>
      <p className="text-ink/70 text-sm">
        Puede que el enlace sea incorrecto, o que el memorial sea privado y necesites una
        invitación para verlo.
      </p>
    </main>
  );
}
