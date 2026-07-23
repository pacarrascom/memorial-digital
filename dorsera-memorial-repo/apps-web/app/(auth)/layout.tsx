export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-8 text-center font-display text-2xl text-ink-900 dark:text-stone-50">
        Dorsera Memorial
      </h1>
      {children}
    </main>
  );
}
