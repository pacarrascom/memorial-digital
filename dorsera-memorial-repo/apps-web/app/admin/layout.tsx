import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-mist-night">
      <header className="flex items-center justify-between border-b border-ash px-8 py-4 dark:border-ash-night">
        <span className="font-display text-lg text-ink-900 dark:text-stone-50">
          Panel familiar
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-ink-400 dark:text-ash-night">{user?.email}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="px-8 py-10">{children}</main>
    </div>
  );
}
