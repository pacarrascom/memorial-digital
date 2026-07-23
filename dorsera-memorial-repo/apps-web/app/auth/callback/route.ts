import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Recibe el ?code= que Supabase Auth agrega al enlace de confirmación
 * de correo (o de un futuro login OAuth) y lo intercambia por una sesión.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
