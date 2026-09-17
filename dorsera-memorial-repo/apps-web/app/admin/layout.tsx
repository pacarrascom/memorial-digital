import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-mist-night">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ash px-4 py-4 sm:px-6 lg:px-8 dark:border-ash-night">
        <span className="font-display text-lg text-ink-900 dark:text-stone-50">
          Panel familiar
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-ink-400 dark:text-ash-night">{user?.email}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">{children}</main>
    </div>
  );
}
