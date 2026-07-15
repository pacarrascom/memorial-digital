export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="font-display text-3xl">Dorsera Memorial</h1>
      <p className="text-ink/80">
        Cada memorial vive en su propia página, accesible mediante el código QR físico instalado
        en la lápida, nicho o placa conmemorativa correspondiente.
      </p>
      <p className="text-sm text-ink/60">
        Ejemplo: <code>/m/maria-elena-rojas</code>
      </p>
    </main>
  );
}
